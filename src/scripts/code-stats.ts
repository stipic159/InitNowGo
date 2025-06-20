import fs from 'fs';
import path from 'path';
import ts from 'typescript';

interface CodeStats {
  totalLines: number;
  variables: {
    const: number;
    let: number;
  };
  functions: number;
  classes: number;
  interfaces: number;
}

async function analyzeProject(rootDir: string): Promise<CodeStats> {
  const stats: CodeStats = {
    totalLines: 0,
    variables: { const: 0, let: 0 },
    functions: 0,
    classes: 0,
    interfaces: 0
  };

  async function processFile(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    stats.totalLines += content.split('\n').length;

    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    function walk(node: ts.Node) {
      switch (node.kind) {
        case ts.SyntaxKind.VariableDeclarationList:
          const declaration = node as ts.VariableDeclarationList;
          if (declaration.getText().includes('const')) stats.variables.const++;
          if (declaration.getText().includes('let')) stats.variables.let++;
          break;
        
        case ts.SyntaxKind.FunctionDeclaration:
          stats.functions++;
          break;
          
        case ts.SyntaxKind.ClassDeclaration:
          stats.classes++;
          break;
          
        case ts.SyntaxKind.InterfaceDeclaration:
          stats.interfaces++;
          break;
      }
      ts.forEachChild(node, walk);
    }

    walk(sourceFile);
  }

  async function traverseDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        if (entry.name === 'logs') continue;
        await traverseDir(fullPath);
      } else if (entry.isFile() && /\.ts$/.test(entry.name)) {
        await processFile(fullPath);
      }
    }
  }

  await traverseDir(rootDir);
  return stats;
}

// Запуск анализа
analyzeProject(path.join(__dirname, '..'))
  .then(stats => {
    console.log('Статистика проекта:');
    console.log(`Всего строк: ${stats.totalLines}`);
    console.log(`Переменные: const(${stats.variables.const}) let(${stats.variables.let}) Всего(${stats.variables.const + stats.variables.let})`);
    console.log(`Функции: ${stats.functions}`);
    console.log(`Классы: ${stats.classes}`);
    console.log(`Интерфейсы: ${stats.interfaces}`);
  })
  .catch(console.error); 