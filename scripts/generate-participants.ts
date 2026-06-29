import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseParticipantFile } from '../src/lib/participants';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const userDataDir = path.join(rootDir, 'userData');
const outputDir = path.join(rootDir, 'src', 'data', 'generated');
const outputFile = path.join(outputDir, 'participants.json');

const participantFiles = (await readdir(userDataDir))
  .filter((fileName) => fileName.toLowerCase().endsWith('.txt'))
  .sort((a, b) => a.localeCompare(b));

const parsedParticipants = await Promise.all(
  participantFiles.map(async (fileName) => {
    const text = await readFile(path.join(userDataDir, fileName), 'utf8');
    if (!text.trim()) {
      console.warn(`Skipping empty participant file: ${path.join('userData', fileName)}`);
      return undefined;
    }

    return parseParticipantFile({ fileName, text });
  }),
);

const participants = parsedParticipants.filter((participant) => participant !== undefined);

await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, `${JSON.stringify(participants, null, 2)}\n`);

console.log(`Generated ${path.relative(rootDir, outputFile)} from ${participants.length} participant file(s).`);
