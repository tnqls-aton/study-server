# GitHub Actions Workflow 개선점 분석

현재 구현된 `gemini-ai-assistant.yml` 워크플로우의 문제점과 개선 방안입니다.

---

## 🔴 Critical Issues (즉시 수정 필요)

### 1. Gemini CLI에 코드베이스 컨텍스트가 전달되지 않음

**문제**:
```yaml
RESPONSE=$(gemini -p "${{ steps.prepare.outputs.prompt }}" --output-format json)
```
- 현재는 프롬프트만 전달하고 실제 코드 파일 내용은 전달하지 않음
- Gemini가 코드를 볼 수 없어서 제대로 분석/수정 불가능

**해결책**:
```bash
# 옵션 1: 특정 파일을 stdin으로 전달
cat src/module/chat/service/chat.service.ts | gemini -p "Review this code" --output-format json

# 옵션 2: 디렉토리 포함
gemini -p "Review the chat module" --include-directories src/module/chat --output-format json

# 옵션 3: 전체 코드베이스 포함 (작은 프로젝트만)
gemini -p "Review code" --include-directories src --output-format json
```

**권장 접근 방식**:
- 이슈 본문에서 파일 경로를 파싱
- 해당 파일들만 Gemini에 전달
- 또는 `--include-directories` 플래그 사용

### 2. 변경사항 적용 로직이 매우 취약함

**문제** (170-198번째 줄):
```bash
awk -v orig="$ORIGINAL" -v mod="$MODIFIED" '
  BEGIN { found=0 }
  {
    if (!found && index($0, orig) > 0) {
      gsub(orig, mod)
      found=1
    }
    print
  }
' "$FILE" > "$TEMP_FILE"
```

**문제점**:
- 단일 라인 매칭만 가능 (여러 줄 코드 블록 처리 불가)
- 정확한 매칭 실패 시 아무것도 변경 안 됨
- 특수 문자, 따옴표, 정규식 메타 문자 처리 안 됨
- 같은 코드가 여러 곳에 있으면 첫 번째만 변경

**해결책**:

**옵션 A**: Gemini가 전체 파일 내용을 생성하도록 변경
```json
{
  "changes": [
    {
      "file": "path/to/file.ts",
      "description": "Fixed bug",
      "full_content": "전체 파일 내용..."
    }
  ]
}
```
- 장점: 확실한 변경, 복잡한 수정 가능
- 단점: diff가 크고, 여러 사람이 동시 작업 시 충돌

**옵션 B**: diff/patch 형식 사용
```bash
echo "$DIFF_CONTENT" | patch -p1
```
- 장점: 표준 방식, 안전함
- 단점: Gemini가 올바른 diff를 생성해야 함

**옵션 C**: 별도 Python/Node.js 스크립트 사용
- AST 파싱으로 정확한 코드 수정
- 더 복잡하지만 안정적

### 3. API 키 검증 없음

**문제**:
```yaml
env:
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```
- Secret이 설정되지 않았을 때 명확한 에러 메시지 없음

**해결책**:
```bash
- name: Validate API Key
  run: |
    if [ -z "${{ secrets.GEMINI_API_KEY }}" ]; then
      echo "::error::GEMINI_API_KEY secret is not set"
      exit 1
    fi
```

---

## 🟡 High Priority Issues (중요한 개선)

### 4. JSON 파싱 실패 처리 부족

**문제** (156번째 줄):
```bash
CHANGES_COUNT=$(jq -r '.changes | length' gemini_response.json 2>/dev/null || echo "0")
```
- Gemini가 잘못된 JSON을 반환하면 조용히 실패
- 디버깅 어려움

**해결책**:
```bash
# JSON 유효성 검증
if ! jq empty gemini_response.json 2>/dev/null; then
  echo "::error::Invalid JSON response from Gemini"
  echo "Response content:"
  cat gemini_response.json
  exit 1
fi
```

### 5. 프롬프트에서 JSON 형식 강제가 약함

**문제**:
- Gemini가 설명 텍스트와 JSON을 섞어서 반환할 수 있음
- Markdown 코드 블록(```json)으로 감쌀 수 있음

**해결책**:
```bash
# Gemini 응답에서 JSON 추출
RESPONSE=$(gemini ... | grep -E '^\{' | head -1)

# 또는 Python으로 파싱
python3 -c "
import json, sys
content = sys.stdin.read()
# Remove markdown code blocks
if '```json' in content:
    content = content.split('```json')[1].split('```')[0]
try:
    data = json.loads(content)
    print(json.dumps(data))
except:
    sys.exit(1)
" < gemini_response.json > parsed.json
```

### 6. 보안: `git add .` 사용

**문제** (230번째 줄):
```bash
git add .
```
- 의도하지 않은 파일까지 커밋될 수 있음
- `.env`, 비밀 키 파일 등

**해결책**:
```bash
# Gemini가 수정한 파일만 추가
jq -r '.changes[].file' gemini_response.json | while read -r file; do
  if [ -f "$file" ]; then
    git add "$file"
  fi
done

# 또는 변경된 파일만
git add -u
```

---

## 🟢 Nice to Have (추가 개선)

### 7. 코드베이스 크기 제한 없음

**문제**:
- Gemini CLI에 전체 `src/` 디렉토리를 보내면 토큰 제한 초과 가능
- 비효율적

**해결책**:
```bash
# 파일 크기 체크
TOTAL_SIZE=$(find src -name "*.ts" -exec wc -c {} + | tail -1 | awk '{print $1}')
MAX_SIZE=500000  # 500KB

if [ "$TOTAL_SIZE" -gt "$MAX_SIZE" ]; then
  echo "::warning::Codebase too large, analyzing specific modules only"
  # 특정 디렉토리만 분석
fi
```

### 8. 재시도 로직 없음

**문제**:
- 네트워크 오류, API 속도 제한 등으로 실패 시 재시도 안 함

**해결책**:
```bash
# Retry logic
MAX_RETRIES=3
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if RESPONSE=$(gemini -p "..." --output-format json); then
    break
  fi
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Retry $RETRY_COUNT/$MAX_RETRIES"
  sleep 5
done
```

### 9. 워크플로우 테스트 방법 없음

**문제**:
- 로컬에서 테스트하기 어려움
- 실제 이슈를 만들어야만 테스트 가능

**해결책**:
```bash
# act로 로컬 테스트 (GitHub Actions 로컬 실행)
act issues -e test-event.json

# test-event.json:
{
  "issue": {
    "number": 1,
    "title": "Test issue",
    "body": "Test body",
    "labels": [{"name": "ai-code-review"}]
  }
}
```

---

## 📋 우선순위별 개선 순서

1. **즉시 수정 (Critical)**:
   - Issue #1: 코드베이스 컨텍스트 전달
   - Issue #2: 변경사항 적용 로직 개선
   - Issue #3: API 키 검증

2. **다음 단계 (High Priority)**:
   - Issue #4: JSON 파싱 오류 처리
   - Issue #5: JSON 형식 강제
   - Issue #6: 보안 개선 (git add)

3. **추후 개선 (Nice to Have)**:
   - Issue #7: 코드베이스 크기 제한
   - Issue #8: 재시도 로직
   - Issue #9: 로컬 테스트 환경

---

## 🔧 개선된 워크플로우 예제 (핵심 부분만)

```yaml
- name: Extract file paths from issue
  id: extract-files
  run: |
    # 이슈 본문에서 파일 경로 추출
    FILES=$(echo "${{ github.event.issue.body }}" | grep -oE 'src/[a-zA-Z0-9/_.-]+\.ts' | head -5)
    echo "files<<EOF" >> $GITHUB_OUTPUT
    echo "$FILES" >> $GITHUB_OUTPUT
    echo "EOF" >> $GITHUB_OUTPUT

- name: Run Gemini Analysis
  run: |
    # 관련 파일들을 Gemini에 전달
    FILES="${{ steps.extract-files.outputs.files }}"

    if [ -z "$FILES" ]; then
      # 파일 명시 없으면 특정 디렉토리 분석
      gemini -p "Analyze and improve this code: ${{ github.event.issue.body }}" \
        --include-directories src/module \
        --output-format json > response.json
    else
      # 특정 파일들 분석
      for file in $FILES; do
        cat "$file"
      done | gemini -p "Review and improve these files: ${{ github.event.issue.body }}" \
        --output-format json > response.json
    fi

- name: Apply Changes (Improved)
  run: |
    # Gemini가 전체 파일 내용을 생성하도록 변경
    jq -r '.changes[] | @json' response.json | while read -r change; do
      FILE=$(echo "$change" | jq -r '.file')
      CONTENT=$(echo "$change" | jq -r '.full_content')

      if [ -f "$FILE" ] && [ -n "$CONTENT" ] && [ "$CONTENT" != "null" ]; then
        echo "$CONTENT" > "$FILE"
        echo "Updated $FILE"
      fi
    done
```

---

## 참고 자료

- [Gemini CLI Headless Mode Documentation](https://google-gemini.github.io/gemini-cli/docs/cli/headless.html)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
