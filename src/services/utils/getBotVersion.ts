import * as fs from 'fs';
import * as path from 'path';

function findPackageJsonRoot(startDir: string): string | null {
  let dir = startDir;

  while (dir !== path.parse(dir).root) {
    const candidate = path.join(dir, 'package.json');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    dir = path.dirname(dir);
  }

  return null;
}

export function getBotVersion(): string | null {
  try {
    const packageJsonPath = findPackageJsonRoot(__dirname);
    if (!packageJsonPath) {
      console.error('Could not find package.json in any parent directory.');
      return null;
    }

    const rawData = fs.readFileSync(packageJsonPath, 'utf-8');
    const json = JSON.parse(rawData);
    return json.version || null;
  } catch (error) {
    console.error('Error reading version from package.json:', error);
    return null;
  }
}
