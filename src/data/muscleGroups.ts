export const MUSCLE_GROUPS = [
  '대흉근',
  '광배근',
  '승모근',
  '삼각근',
  '상완이두근',
  '상완삼두근',
  '전완근',
  '복근',
  '척추기립근',
  '둔근',
  '대퇴사두',
  '햄스트링',
  '내전근',
  '외전근',
  '하퇴삼두근',
  '경부근',
  '기타',
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];

const MUSCLE_ALIASES: Record<string, MuscleGroup> = {
  가슴: '대흉근',
  어깨: '삼각근',
  이두: '상완이두근',
  삼두: '상완삼두근',
  등: '광배근',
  '등 (광배근)': '광배근',
  '등 (중부)': '광배근',
  '등 (하부/허리)': '척추기립근',
  허리: '척추기립근',
  목: '경부근',
  종아리: '하퇴삼두근',
  '허벅지 앞 (대퇴사두)': '대퇴사두',
  '허벅지 뒤 (햄스트링)': '햄스트링',
  '엉덩이 (둔근)': '둔근',
  대퇴사두근: '대퇴사두',
  승모: '승모근',
  traps: '승모근',
  trapezius: '승모근',
} as const satisfies Record<string, MuscleGroup>;

export function normalizeMuscleLabel<T extends string | null | undefined>(label: T): T | MuscleGroup {
  if (!label) return label;
  return MUSCLE_ALIASES[label] ?? label;
}
