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
const participants = await Promise.all(participantFiles.map(async (fileName) => {
    const text = await readFile(path.join(userDataDir, fileName), 'utf8');
    return parseParticipantFile({ fileName, text });
}));
await mkdir(outputDir, { recursive: true });
await writeFile(outputFile, `${JSON.stringify(participants, null, 2)}\n`);
console.log(`Generated ${path.relative(rootDir, outputFile)} from ${participants.length} participant file(s).`);
