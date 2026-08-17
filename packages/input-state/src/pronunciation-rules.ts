export interface SoundChangeRule {
  name: string;
  pattern: RegExp; // 必須帶 g flag
  restore: string;
}

// 표준발음법 18 항：받침 ㄱ/ㅂ 在 ㄴ、ㅁ 前面鼻音化成 ㅇ/ㅁ。
// 這兩條是初學者最常踩到的（-습니다/-ㅂ니다 敬語句尾），且都有清楚、單一的還原方式。
export const SOUND_CHANGE_RULES: SoundChangeRule[] = [
  { name: "받침 ㅂ 鼻音化（ㅂ→ㅁ，在 ㄴ/ㅁ 前）", pattern: /m(?=[nm])/g, restore: "b" },
  { name: "받침 ㄱ 鼻音化（ㄱ→ㅇ，在 ㄴ/ㅁ 前）", pattern: /ng(?=[nm])/g, restore: "g" },
];

interface Occurrence {
  start: number;
  end: number;
  restore: string;
}

function findOccurrences(spelling: string): Occurrence[] {
  const occurrences: Occurrence[] = [];
  for (const rule of SOUND_CHANGE_RULES) {
    const re = new RegExp(rule.pattern); // 複製一份，避免共用同一個 regex 的 lastIndex
    let match: RegExpExecArray | null;
    while ((match = re.exec(spelling))) {
      occurrences.push({ start: match.index, end: match.index + match[0].length, restore: rule.restore });
    }
  }
  return occurrences.sort((a, b) => a.start - b.start);
}

/**
 * 對輸入的羅馬字，猜測還原成拼寫式的變體（不含原字串本身）。
 * 每個音變出現的位置各自獨立要不要還原，回傳所有組合（實務上幾乎都只有 0~1 處）。
 */
export function pronunciationVariants(spelling: string): string[] {
  const occurrences = findOccurrences(spelling);
  if (occurrences.length === 0) return [];

  const variants = new Set<string>();
  const total = 1 << occurrences.length;
  for (let mask = 1; mask < total; mask++) {
    let result = spelling;
    for (let bit = occurrences.length - 1; bit >= 0; bit--) {
      if (mask & (1 << bit)) {
        const occ = occurrences[bit];
        result = result.slice(0, occ.start) + occ.restore + result.slice(occ.end);
      }
    }
    variants.add(result);
  }
  return [...variants];
}
