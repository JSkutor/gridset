# 🌿 GridSet Git 브랜치 네이밍 및 워크플로우 컨벤션 (Git Branching Guide)

GridSet 프로젝트의 안정적인 개발과 명확한 히스토리 추적을 위해 정의된 Git 브랜치 관리 규칙입니다. 모든 개발자(및 AI 에이전트)는 본 가이드를 준수하여 브랜치를 생성하고 관리해야 합니다.

---

## 🎯 브랜치 네이밍 규칙 (Branch Naming Convention)

브랜치 이름은 항상 **`접두사/작업-내용-요약`** 형식을 사용합니다. 모든 영문은 **소문자**를 사용하며, 단어 사이는 **하이픈(`-`)**으로 연결합니다.

### 1. 표준 접두사 (Prefixes)

| 접두사 | 사용 대상 | 예시 |
| :--- | :--- | :--- |
| **`feature/`** 또는 **`feat/`** | 새로운 기능 추가 및 개발 | `feature/session-grouping`, `feat/rest-timer` |
| **`fix/`** 또는 **`bugfix/`** | 버그 및 오류 수정 | `fix/supabase-sync-error`, `bugfix/timer-safari-glitch` |
| **`refactor/`** | 기능 동작의 변화 없이 코드를 구조적으로 개선 | `refactor/workout-store-slices` |
| **`style/`** | 레이아웃, 마진, CSS 디자인, 글래스모피즘 등 스타일 변경 | `style/set-page-spacing`, `style/darkmode-glow` |
| **`test/`** | 테스트 코드 추가, 수정 및 테스트 환경 구축 | `test/routine-keyboard-nav`, `test/playwright-e2e` |
| **`docs/`** | 문서 작성 및 수정 (README, Wiki 등) | `docs/git-branch-convention`, `docs/update-schema` |
| **`chore/`** | 의존성 라이브러리 추가, 빌드 스크립트 수정, 패키지 설정 등 | `chore/eslint-config`, `chore/package-update` |

### 2. 세부 네이밍 가이드라인
* **구체적이고 간결하게**: 브랜치 이름만 보고도 어떤 영역을 작업 중인지 추측할 수 있어야 합니다. (나쁜 예: `feature/new`, `fix/bug`, `test/routine`)
* **일관된 언어**: 영문 소문자를 기본으로 하되 의미가 명확하게 통하는 명사/동사 조합을 권장합니다.
* **커밋 히스토리가 복잡하게 섞여 있는 경우**: 브랜치 내에 여러 성격의 커밋이 혼재하더라도, 해당 브랜치의 **가장 중심이 되는 목표 기능**을 기준으로 이름을 명명합니다.

---

## 🛠️ 주요 브랜치 조작 치트시트 (Git Cheat Sheet)

### 1. 로컬 브랜치 이름 변경 (Rename)
현재 작업 중인 브랜치나 다른 브랜치의 이름을 변경할 때 아래 명령어를 사용합니다.

```bash
# 1. 이름을 바꿀 브랜치로 먼저 이동
git checkout <구-브랜치명>

# 2. 브랜치 이름 변경
git branch -m <신-브랜치명>
```
*만약 다른 브랜치에 있는 상태에서 특정 브랜치의 이름을 바꾸려면:*
```bash
git branch -m <구-브랜치명> <신-브랜치명>
```

### 2. 이미 원격(Remote)에 푸시된 브랜치 이름 변경
원격 저장소에 이미 올라간 브랜치 이름을 바꿀 때는 로컬에서 변경 후 원격을 동기화해야 합니다.
```bash
# 1. 로컬 브랜치 이름 변경
git branch -m <구-브랜치명> <신-브랜치명>

# 2. 원격에 새 이름의 브랜치 푸시
git push origin <신-브랜치명>

# 3. 원격에서 이전 이름의 브랜치 삭제
git push origin --delete <구-브랜치명>

# 4. 새 브랜치와 원격의 상류(Upstream) 트래킹 연결
git push origin -u <신-브랜치명>
```

### 3. 머지 완료된 브랜치 정리 (Delete)
`main` 브랜치에 성공적으로 머지(Merge)되어 더 이상 필요 없는 로컬 브랜치는 주기적으로 삭제하여 작업 공간을 깔끔하게 유지합니다.
```bash
# 안전한 삭제 (머지되지 않은 내용이 있으면 경고 표시)
git branch -d <삭제할-브랜치명>

# 강제 삭제 (경고 무시하고 무조건 삭제)
git branch -D <삭제할-브랜치명>
```

---

## 🔄 GridSet 권장 개발 워크플로우

1. **최신 main 브랜치 확보**:
   ```bash
   git checkout main
   git pull origin main
   ```
2. **컨벤션에 맞춘 작업 브랜치 생성**:
   ```bash
   git checkout -b feature/session-grouping
   ```
3. **코드 개발 및 커밋 진행** (커밋 메시지도 커밋 컨벤션을 준수하여 작성)
4. **테스트 및 품질 검증**:
   ```bash
   npm run test
   npm run lint
   ```
5. **원격 저장소 푸시 및 Pull Request(PR) 생성**
