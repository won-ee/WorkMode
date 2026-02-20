import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const version = pkg.version;
const filename = `workmode-v${version}.zip`;

try {
  // dist 폴더가 있는지 확인
  execSync('ls dist', { stdio: 'ignore' });
} catch {
  console.error('dist/ 폴더가 없습니다. 먼저 npm run build를 실행하세요.');
  process.exit(1);
}

console.log(`Creating ${filename}...`);
execSync(`cd dist && tar -acf ../${filename} .`, { stdio: 'inherit' });
console.log(`Done: ${filename}`);
