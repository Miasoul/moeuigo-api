const fetch = require('node-fetch');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { year, month, grade, subject, type } = req.query;
    if (!year || !month || !grade || !subject) {
      return res.status(400).json({
        error: '필수 파라미터 누락',
        required: 'year, month, grade, subject',
        optional: 'type (문제 또는 해설, 기본값: 문제)',
        example: '/api/download?year=2023&month=3&grade=3&subject=국어&type=문제'
      });
    }

    const docType = type || '문제';

    const filePatterns = [
      `${year}년-고${grade}-${month}월-모의고사-${subject}-${docType}.pdf`,
      `${year}년-${month}월-고${grade}-모의고사-${subject}-${docType}.pdf`,
      `${year}학년도-${month}월-모의평가-${subject}-${docType}.pdf`,
      `${year}년-${month}월-모의평가-${subject}-${docType}.pdf`,
      `${year}학년도-대수능-${month}월-모의평가-${subject}-${docType}.pdf`,
      `${year}학년도-${month}월-고3-모의고사-${subject}-${docType}.pdf`,
      `${year}년-고3-${month}월-모의고사-화법과작문-${docType}.pdf`,
      `${year}년-${month}월_고3_${subject}-1.pdf`,
      `${year}년-고3-${month}월_${subject}-${docType}.pdf`,
      `${year}학년도-${month}월-고3-${subject}-${docType}.pdf`,
      `${year}_${month}-고3-${subject}영역-문제지.pdf`,
      `${year}_${month}-고3-${subject}영역-정답-및-해설.pdf`,
    ];

    // 전부 동시에 요청, 첫 번째 성공한 놈을 반환
    const result = await Promise.any(
      filePatterns.map(async (fileName) => {
        const url = `https://horaeng.com/storage/${encodeURIComponent(fileName)}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`${resp.status}`);
        const buffer = await resp.buffer();
        return { fileName, buffer };
      })
    );

    const base64Data = result.buffer.toString('base64');
    return res.status(200).json({
      success: true,
      fileName: result.fileName,
      mimeType: 'application/pdf',
      base64: base64Data,
      size: result.buffer.length
    });

  } catch (error) {
    if (error instanceof AggregateError) {
      return res.status(404).json({
        error: '파일을 찾을 수 없음',
        message: '모든 패턴에서 파일을 찾지 못함'
      });
    }
    return res.status(500).json({
      error: '서버 오류',
      message: error.message
    });
  }
};
