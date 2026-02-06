const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS 허용
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 파라미터 받기
    const { year, month, grade, subject, type } = req.query;

    // 필수 파라미터 체크
    if (!year || !month || !grade || !subject) {
      return res.status(400).json({
        error: '필수 파라미터 누락',
        required: 'year, month, grade, subject',
        optional: 'type (문제 또는 해설, 기본값: 문제)',
        example: '/api/download?year=2023&month=3&grade=3&subject=국어&type=문제'
      });
    }

    // type 기본값 설정
    const docType = type || '문제';

    // URL 조합
    const fileName = `${year}년-고${grade}-${month}월-모의고사-${subject}-${docType}.pdf`;
    const pdfUrl = `https://horaeng.com/storage/${encodeURIComponent(fileName)}`;

    console.log('Fetching PDF:', pdfUrl);

    // PDF 다운로드
    const pdfResponse = await fetch(pdfUrl);

    if (!pdfResponse.ok) {
      return res.status(404).json({
        error: '파일을 찾을 수 없음',
        url: pdfUrl,
        status: pdfResponse.status
      });
    }

    // PDF를 buffer로 변환
    const pdfBuffer = await pdfResponse.buffer();

    // base64 인코딩
    const base64Data = pdfBuffer.toString('base64');

    // 응답
    return res.status(200).json({
      success: true,
      fileName: fileName,
      mimeType: 'application/pdf',
      base64: base64Data,
      size: pdfBuffer.length
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: '서버 오류',
      message: error.message
    });
  }
};
