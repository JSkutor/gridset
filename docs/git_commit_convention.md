# 📝 GridSet Git 커밋 메시지 컨벤션 (Git Commit Convention)

GridSet 프로젝트의 깔끔한 히스토리 관리와 가독성을 위해 기존에 작성된 커밋 내역을 분석하여 정의한 커밋 메시지 규칙입니다.

---

## 🌐 작성 언어 권장: 영어 (English)

**커밋 메시지는 영어로 작성하는 것을 권장합니다.** 

### 영어 작성이 더 나은 이유
1. **기존 히스토리와의 일치성**: GridSet의 기존 커밋 메시지는 약 90% 이상 영어(예: `feat: implement ...`, `style: align ...`)로 작성되어 있습니다. 기존 역사와의 연속성을 위해 영어가 가장 좋습니다.
2. **명확한 명령조 표현**: 영어는 Git의 표준인 **명령문 형태(Imperative tone)**로 동작을 짧고 명확하게 기술하기에 매우 유리합니다. (예: `add timer`가 '타이머 추가', '타이머 추가함', '타이머 추가하기' 등 다양하게 나뉘는 한국어보다 일관성을 유지하기 쉽습니다.)
3. **도구 호환성**: 대부분의 Git GUI 도구, GitHub CLI, CI/CD 로그 등에서 깨짐 없이 완벽하게 지원됩니다.

> [!TIP]
> 한국어 설명이 꼭 필요한 핵심 비즈니스 용어나 스키마 정책이 포함된 경우, 영어 설명 뒤에 괄호나 본문(Body)을 활용하여 적절히 병기할 수 있습니다.
> *예: `feat: implement localized search with Korean consonant autocomplete (초성 검색)`*

---

## 📐 커밋 메시지 기본 구조 (Structure)

커밋 메시지는 크게 **제목(Subject)**과 필요한 경우 **본문(Body)**으로 나뉩니다. 제목만으로 설명이 끝나면 본문은 생략할 수 있습니다.

```text
<type>: <description>

[Optional Body - 상세한 변경 내용이나 변경 이유가 필요할 때 작성]
```

### 1. 제목 규칙 (Subject Rules)
* **형식**: `<type>: <description>` (콜론 뒤에 한 칸 띄어쓰기 필수)
* **글자 수**: 공백 포함 70~75자 이내로 간결하게 작성합니다.
* **대소문자**: 접두사(`<type>`)와 설명(`<description>`)의 첫 글자는 모두 **소문자**로 시작합니다.
  * *올바른 예: `feat: implement rest timer`*
  * *잘못된 예: `Feat: Implement rest timer`*
* **마침표**: 제목 끝에 마침표(`.`)를 찍지 않습니다.
* **시제**: **현재 시제 명령문**을 사용하여 동사 원형으로 시작합니다.
  * `implement` (O) / `implemented` (X) / `implements` (X)
  * `add` (O) / `added` (X)
  * `fix` (O) / `fixed` (X)

---

## 🏷️ 커밋 타입 (Commit Types)

기존 커밋 기록에 등장한 타입을 기준으로 엄선한 유형 분류표입니다.

| 타입 | 의미 (언제 사용하나요?) | 대표 동사 |
| :--- | :--- | :--- |
| **`feat`** | 새로운 기능 개발 및 추가 | `implement`, `add`, `support` |
| **`fix`** | 버그, 스크롤 튀는 현상, 포커스 불안정 등 오류 수정 | `fix`, `resolve`, `prevent` |
| **`refactor`** | 동작의 변경 없이 코드 구조, 모듈화, 가독성 개선 | `refactor`, `modularize`, `unify` |
| **`style`** | 마진, 패딩, 글래스모피즘 효과, 줄 바꿈 등 스타일/UI 개선 | `style`, `adjust`, `align` |
| **`test`** | 단위/통합 테스트 추가 및 테스트 구성 설정 | `test`, `cover`, `configure` |
| **`docs`** | 문서 업데이트 및 스키마 명세 변경 | `docs`, `update`, `write` |
| **`chore`** | 패키지 의존성 관리, 린트 정리, 데모 데이터 갱신 | `chore`, `refresh`, `clean` |

---

## 💡 기존 커밋 기반 모범 예시 (Best Practice Examples)

실제 GridSet 리포지토리에 저장된 양질의 커밋 메시지 패턴들입니다. 작성 시 이를 참고하면 통일성을 쉽게 확보할 수 있습니다.

### Feature (기능 추가)
* `feat: implement single-page progressive overload completion card and tests`
* `feat: support unilateral exercise logging and render side badges`
* `feat: implement localized exercise search with Korean consonant autocomplete`

### Refactor (리팩토링)
* `refactor: modularize Zustand store into slices and implement robust testing suite`
* `refactor: unify routine→session naming and overhaul schema`

### Style & Spacing (UI/스타일 미세조정)
* `style: align page panel starting heights and reduce navigation bar bottom gap`
* `style: adjust past logs padding and spreadsheet margins for layout symmetry`

### Bug Fix (오류 해결)
* `fix: improve workout grid scrolling and focus stability`
* `fix: prevent sync failure using robust error handling`

### Test & Docs (테스트/문서)
* `test: cover workout store and grid utilities`
* `docs: update project requirements and roadmap`
