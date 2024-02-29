const mockFetchJson = jest.fn();
const mockFetch = jest.fn().mockResolvedValue({
  ok: true,
  json: mockFetchJson,
});
global.fetch = mockFetch;

import { detectCardId } from '@lib/detectCardId';
import { expectResolvedValueMatch } from '../utils';

const cardNumber = '123123123123';
const name = 'DUPONT';
const firstNames = ['JEAN'];

const highQualityDetection = {
  IsErroredOnProcessing: false,
  OCRExitCode: 1,
  ParsedResults: [
    {
      FileParseExitCode: 1,
      ParsedText:
        'RÉPUBLIQUE FRANÇAISE\t\r\n' +
        `CARTE NATIONALE D'IDENTITÉ N°: ${cardNumber}\tNationalité Française\t\r\n` +
        `${firstNames[0][0]}${name[0]}\tNom: ${name}\t\r\n` +
        `Prénom(s): ${firstNames.join(', ')}\t\r\n` +
        'Sexe: M\tNé(e) le: 01.01.1970\t\r\n' +
        'à: PARIS\t\r\n' +
        'Taille: 1,70m\t\r\n' +
        'Signature\t\r\n' +
        'du titulaire\t\r\n' +
        `IDFRA${name}<<<<<<<<<<<<123123\t\r\n` +
        `${cardNumber}1${firstNames[0]}<<${firstNames[1]}123123123`,
    },
  ],
};

const lowQualityTextDetection = {
  IsErroredOnProcessing: false,
  OCRExitCode: 1,
  ParsedResults: [
    {
      FileParseExitCode: 1,
      ParsedText:
        'PUBLIC\tAISE\t\r\n' +
        `CANALE DENT 123ASD\t\r\n` +
        'PARIS\t\r\n' +
        `${cardNumber}1${firstNames[0]}<<${firstNames[1]}123123123`,
    },
  ],
};

const unreadableTextDetection = {
  IsErroredOnProcessing: false,
  OCRExitCode: 1,
  ParsedResults: [
    {
      FileParseExitCode: 1,
      ParsedText:
        'PUBLIC\tAISE\t\r\n' + `CANALE DENT 123ASD\t\r\n` + 'PARIS\t\r\n',
    },
  ],
};

const failedTextDetection = {
  IsErroredOnProcessing: true,
  OCRExitCode: 4,
  ErrorMessage: 'Some error',
};

const failedFileParsing = {
  IsErroredOnProcessing: false,
  OCRExitCode: 1,
  ParsedResults: [
    {
      FileParseExitCode: 4,
      ErrorMessage: 'Some error',
    },
  ],
};

describe('Detect Card Id', () => {
  it('should return an id when all is well', async () => {
    mockFetchJson.mockResolvedValueOnce(highQualityDetection);
    const result = await detectCardId('imageAsBase64');
    expectResolvedValueMatch(mockFetchJson, highQualityDetection);
    expect(result).toMatchObject({ success: true, id: cardNumber });
  });

  it('should return when text detection fails', async () => {
    mockFetchJson.mockResolvedValueOnce(failedTextDetection);
    const result = await detectCardId('imageAsBase64');
    expectResolvedValueMatch(mockFetchJson, failedTextDetection);
    expect(result).toMatchObject({ success: false });
  });

  it('should return when file parse fails', async () => {
    mockFetchJson.mockResolvedValueOnce(failedFileParsing);
    const result = await detectCardId('imageAsBase64');
    expectResolvedValueMatch(mockFetchJson, failedFileParsing);
    expect(result).toMatchObject({ success: false });
  });

  it('should be able to get cardId from checksum if not explicitly readable', async () => {
    mockFetchJson.mockResolvedValueOnce(lowQualityTextDetection);
    const result = await detectCardId('imageAsBase64');
    expectResolvedValueMatch(mockFetchJson, lowQualityTextDetection);
    expect(result).toMatchObject({ success: true, id: cardNumber });
  });

  it('should return when cardId is not readable', async () => {
    mockFetchJson.mockResolvedValueOnce(unreadableTextDetection);
    const result = await detectCardId('imageAsBase64');
    expectResolvedValueMatch(mockFetchJson, unreadableTextDetection);
    expect(result).toMatchObject({ success: false });
  });

  it('should return if anything throws', async () => {
    mockFetch.mockImplementationOnce(() => {
      throw new Error('Intentional fetch error');
    });
    mockFetchJson.mockImplementationOnce(() => {
      throw new Error('Intentional fetch json error');
    });
    const results = await Promise.all([
      detectCardId('imageAsBase64'),
      detectCardId('imageAsBase64'),
    ]);
    results.forEach((result) => {
      expect(result).toMatchObject({ success: false });
    });
  });
});
