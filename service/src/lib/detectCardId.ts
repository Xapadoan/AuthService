import 'dotenv/config';
import { Failable, handleResponse } from '@authservice/shared';

const { OCRSPACE_URL, OCRSPACE_API_KEY } = process.env;

interface OCRSpaceResponse {
  IsErroredOnProcessing: boolean;
  OCRExitCode: number;
  ErrorMessage?: string[];
  ParsedResults?: Array<{
    FileParseExitCode: number;
    ParsedText: string;
    ErrorMessage?: string;
  }>;
}

export async function textDetection(
  base64Image: string
): Promise<Failable<{ text: string }>> {
  try {
    const data = new FormData();
    data.append('base64Image', base64Image);
    data.append('language', 'fre');
    data.append('filetype', 'PNG');
    data.append('OCREngine', '2');
    data.append('isTable', 'true');
    const textDetection = await fetch(String(OCRSPACE_URL), {
      method: 'POST',
      headers: {
        apikey: String(OCRSPACE_API_KEY),
      },
      body: data,
    }).then((res) => handleResponse<OCRSpaceResponse>(res));
    if (textDetection.OCRExitCode !== 1) {
      console.error(
        'Text detection failed with code ',
        textDetection.OCRExitCode
      );
      console.error('Message: ', textDetection.ErrorMessage);
      return { success: false, error: 'Text detection failed' };
    }
    const parsedResults = textDetection.ParsedResults?.[0];
    if (!parsedResults || parsedResults.FileParseExitCode !== 1) {
      console.error(
        'File Parse failed with code ',
        parsedResults?.FileParseExitCode || -1
      );
      console.error('Message: ', parsedResults?.ErrorMessage || 'No results');
      return { success: false, error: 'File parse failed' };
    }
    return { success: true, text: String(parsedResults.ParsedText) };
  } catch (error) {
    console.error('Text detection unexpected error: ', error);
    return { success: false, error: 'Unexpected error' };
  }
}

interface CardInfos {
  label: string;
  number: string;
  initials: string;
  name: string;
  firstNames: string[];
  sex: 'M' | 'F';
  bornDayOfMonth: number;
  bornMonthOfYear: number;
  bornYear: number;
  checksum1: string;
  checksum2: string;
}

function getCardInfos(text: string): Partial<CardInfos> {
  const infos: Partial<CardInfos> = {};
  const lines = text.split('\t\r\n').filter((line) => line !== '');
  infos.label = lines[0];
  const numberLine = lines.find(
    (line) =>
      line.includes('CARTE') ||
      line.includes('NATIONALE') ||
      line.includes('IDENTIT')
  );
  if (numberLine) {
    const numberMatchs = numberLine.match(
      /^CARTE NATIONALE D'IDENTITÉ N°:[\s]*(\d+)/
    );
    if (numberMatchs) {
      infos.number = numberMatchs[1];
    }
  }
  const nameLine = lines.find((line) => line.includes('Nom'));
  if (nameLine) {
    const nameMatchs = nameLine.match(/^([\p{Lu}]{2})?.*Nom\W*([\p{Lu}]+)/u);
    if (nameMatchs) {
      infos.initials = nameMatchs[1];
      infos.name = nameMatchs[2];
    }
  }
  const firstNameLine = lines.find((line) => line.includes('nom'));
  if (firstNameLine) {
    const firstNameMatchs = firstNameLine.match(/(\W{2}(\p{Lu}+))/gu);
    if (firstNameMatchs) {
      infos.firstNames = [];
      firstNameMatchs.forEach((match) => {
        const firstName = match.match(/([\p{Lu}]+)/u)?.[1];
        if (firstName) {
          infos.firstNames?.push(firstName);
        }
      });
    }
  }
  const birthLine = lines.find(
    (line) => line.includes('Sex') || line.includes('Né') || line.includes('Ne')
  );
  if (birthLine) {
    const birthMatchs = birthLine.match(
      /^[^M|F]+([M|F]?)[^\d]+([\d]{2})?[^\d]*([\d]{2})?[^\d]*([\d]{4})?/
    );
    if (birthMatchs) {
      infos.sex = birthMatchs[1] === 'M' ? 'M' : 'F';
      infos.bornDayOfMonth = Number(birthMatchs[2]);
      infos.bornMonthOfYear = Number(birthMatchs[3]);
      infos.bornYear = Number(birthMatchs[4]);
    }
  }
  infos.checksum1 = lines[lines.length - 2];
  infos.checksum2 = lines[lines.length - 1];
  if (!infos.number && infos.checksum2) {
    const numberMatchs = infos.checksum2.match(/^([\d]{12})/);
    if (numberMatchs) {
      infos.number = numberMatchs[1];
    }
  }
  console.log(infos);
  return infos;
}

export async function detectCardId(
  base64Image: string
): Promise<Failable<{ id: string }>> {
  const rawText = await textDetection(base64Image);
  if (!rawText.success) return rawText;
  const infos = getCardInfos(rawText.text);
  if (!infos.number) {
    return { success: false, error: 'Could not get the card id' };
  }
  return { success: true, id: infos.number };
}
