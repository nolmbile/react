export const TITLE_MAX_LENGTH = 100
export const BODY_MAX_LENGTH = 5000

export function validatePostInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { error: '게시글 내용을 확인해 주세요.' }
  }

  if (typeof input.title !== 'string' || typeof input.body !== 'string') {
    return { error: '제목과 본문을 입력해 주세요.' }
  }

  const title = input.title.trim()
  const body = input.body.trim()
  const titleLength = [...title].length
  const bodyLength = [...body].length

  if (!title || !body) {
    return { error: '제목과 본문을 모두 입력해 주세요.' }
  }
  if (title.includes('\u0000') || body.includes('\u0000')) {
    return { error: '허용되지 않는 문자가 포함되어 있습니다.' }
  }
  if (titleLength > TITLE_MAX_LENGTH) {
    return { error: `제목은 ${TITLE_MAX_LENGTH}자 이내로 작성해 주세요.` }
  }
  if (bodyLength > BODY_MAX_LENGTH) {
    return { error: `본문은 ${BODY_MAX_LENGTH.toLocaleString('ko-KR')}자 이내로 작성해 주세요.` }
  }
  if (input.isAnonymous !== undefined && typeof input.isAnonymous !== 'boolean') {
    return { error: '익명 표시 설정을 확인해 주세요.' }
  }

  return {
    value: {
      title,
      body,
      isAnonymous: input.isAnonymous ?? true,
    },
  }
}