import 'dotenv/config';
import { createReadStream } from 'node:fs';

// const { OCRSPACE_URL, OCRSPACE_API_KEY } = process.env;

async function toBase64(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const readStream = createReadStream(path, 'base64');
    let string = '';
    readStream.on('data', (data: string) => {
      string += data;
    });
    readStream.once('end', () => {
      readStream.close();
      resolve(string);
    });
    readStream.on('error', (err) => {
      reject(err);
    });
  });
}

interface OCRSpaceResponse {
  IsErroredOnProcessing: boolean;
  OCRExitCode: number;
  ErrorMessage?: string[];
  ParsedResults: Array<{
    FileParseExitCode: number;
    ParsedText: string;
    ErrorMessage?: string;
    ErrorDetails?: string;
  }>;
}

export async function extractFileText(
  base64Image: string
): Promise<string | undefined> {
  try {
    const data = new FormData();
    data.append('base64Image', base64Image);
    data.append('language', 'fre');
    data.append('filetype', 'JPG');
    data.append('OCREngine', '2');
    data.append('isTable', 'true');
    const textDetection: OCRSpaceResponse = await fetch(
      'https://api.ocr.space/parse/image',
      {
        method: 'POST',
        headers: {
          apikey: 'K88966559588957',
        },
        body: data,
      }
    ).then((res) => res.json());
    if (textDetection.OCRExitCode !== 1) {
      console.error(
        'Text detection failed with code ',
        textDetection.OCRExitCode
      );
      console.error('Message: ', textDetection.ErrorMessage);
      return;
    }
    const parsedResults = textDetection.ParsedResults?.[0];
    if (!parsedResults || parsedResults.FileParseExitCode !== 1) {
      console.error(
        'File Parse failed with code ',
        parsedResults.FileParseExitCode
      );
      console.error('Message: ', parsedResults.ErrorMessage);
    }
    console.log(typeof parsedResults.ParsedText);
    console.log(parsedResults.ParsedText);
    // console.log(Object.keys(parsedResults));
    return String(parsedResults.ParsedText);
  } catch (error) {
    console.log(error);
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
  console.log(infos);
  return infos;
}

(async () => {
  const b64 = await toBase64('./service/src/lib/test2.jpg').catch(
    console.error
  );
  if (!b64) return;
  console.log(b64.slice(1, 20));
  const text = await extractFileText(`data:image/jpg;base64,${b64}`);
  if (!text) return;
  getCardInfos(text);
})();
