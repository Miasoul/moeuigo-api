import requests
import base64
import os
import sys

# API 기본 URL (Vercel 배포 주소에 맞게 수정)
API_URL = "https://moeuigo-api.vercel.app/api/download"

# 과목 목록
SUBJECTS = [
    "국어", "수학", "영어", "한국사",
    "생활과윤리", "윤리와사상", "한국지리", "세계지리",
    "동아시아사", "세계사", "경제", "정치와법", "사회문화",
    "물리학1", "화학1", "생명과학1", "지구과학1"
]


def download_pdf(year, month, grade, subject, doc_type="문제", save_dir="downloads"):
    """모의고사 PDF를 다운로드하여 저장합니다."""
    params = {
        "year": year,
        "month": month,
        "grade": grade,
        "subject": subject,
        "type": doc_type
    }

    print(f"요청 중: {year}년 고{grade} {month}월 {subject} {doc_type}...")

    try:
        resp = requests.get(API_URL, params=params, timeout=30)
    except requests.RequestException as e:
        print(f"  요청 실패: {e}")
        return False

    if resp.status_code == 404:
        print(f"  파일 없음 (404)")
        return False

    if resp.status_code != 200:
        print(f"  오류 발생 (HTTP {resp.status_code}): {resp.text}")
        return False

    data = resp.json()
    if not data.get("success"):
        print(f"  실패: {data}")
        return False

    # base64 디코딩 후 PDF 저장
    os.makedirs(save_dir, exist_ok=True)
    file_name = data["fileName"]
    file_path = os.path.join(save_dir, file_name)

    pdf_bytes = base64.b64decode(data["base64"])
    with open(file_path, "wb") as f:
        f.write(pdf_bytes)

    size_kb = len(pdf_bytes) / 1024
    print(f"  저장 완료: {file_path} ({size_kb:.1f} KB)")
    return True


def main():
    print("=== 모의고사 PDF 다운로더 ===\n")

    # 기본값
    year = input("년도 (예: 2024): ").strip()
    month = input("월 (3, 4, 6, 7, 9, 10): ").strip()
    grade = input("학년 (1, 2, 3): ").strip()

    print("\n과목 목록:")
    for i, s in enumerate(SUBJECTS, 1):
        print(f"  {i:2d}. {s}")

    subject_input = input("\n과목 번호 또는 이름 (전체: all): ").strip()
    doc_type = input("유형 (문제/해설, 기본: 문제): ").strip() or "문제"

    # 과목 결정
    if subject_input.lower() == "all":
        subjects = SUBJECTS
    elif subject_input.isdigit():
        idx = int(subject_input) - 1
        if 0 <= idx < len(SUBJECTS):
            subjects = [SUBJECTS[idx]]
        else:
            print("잘못된 번호입니다.")
            return
    else:
        subjects = [subject_input]

    print()
    success = 0
    fail = 0
    for subject in subjects:
        if download_pdf(year, month, grade, subject, doc_type):
            success += 1
        else:
            fail += 1

    print(f"\n완료: 성공 {success}개, 실패 {fail}개")


if __name__ == "__main__":
    main()
