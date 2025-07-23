import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

interface ConfigMapNode {
  fnName: string;
  typeName: string;
  importPath: string;
}

function unwrapNonNullable<T>(
  value: T,
  message = "Value is null or undefined"
): Exclude<T, null | undefined> {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
  return value as Exclude<T, null | undefined>;
}

export function generate(config: string, project: string) {
  const configPath = path.resolve(process.cwd(), config);
  const program = ts.createProgram([configPath], {
    project,
  });
  const checker = program.getTypeChecker();
  const configSource = unwrapNonNullable(
    program.getSourceFile(configPath),
    "Could not read ftson.config.ts"
  );

  const configMap = new Map<string, Map<string, ConfigMapNode>>();
  const typeImports = new Map<string, string>();

  function extractTypeImports() {
    ts.forEachChild(configSource, (node) => {
      if (!ts.isImportDeclaration(node)) return;
      const moduleSpecifier = (node.moduleSpecifier as ts.StringLiteral).text;

      if (!node.importClause || !node.importClause.namedBindings) return;
      const named = node.importClause.namedBindings;

      if (ts.isNamedImports(named)) {
        for (const el of named.elements) {
          const name = el.name.text;
          typeImports.set(name, moduleSpecifier);
        }
      }
    });
  }

  function extractConfigObject() {
    ts.forEachChild(configSource, (node) => {
      if (!ts.isVariableStatement(node)) return;

      for (const decl of node.declarationList.declarations) {
        if (
          ts.isIdentifier(decl.name) &&
          decl.name.text === "stringify" &&
          decl.initializer &&
          ts.isObjectLiteralExpression(decl.initializer)
        ) {
          for (const [key, value] of decl.initializer.properties.flatMap(
            (p) => {
              if (!ts.isPropertyAssignment(p) || !ts.isStringLiteral(p.name))
                return [];
              return [[p.name.text, p.initializer] as const];
            }
          )) {
            if (!value || !ts.isObjectLiteralExpression(value)) continue;

            for (const prop of value.properties) {
              if (
                !ts.isPropertyAssignment(prop) ||
                !(ts.isStringLiteral(prop.name) || ts.isIdentifier(prop.name))
              )
                continue;

              const fnName = prop.name.text;
              let callExpr = prop.initializer;
              let callee = callExpr;
              while (ts.isCallExpression(callee)) {
                callExpr = callee;
                callee = callee.expression;
              }
              if (
                ts.isCallExpression(callExpr) &&
                ts.isIdentifier(callee) &&
                callee.text === "schema"
              ) {
                const [typeArg] = callExpr.typeArguments || [];
                if (
                  typeArg &&
                  ts.isTypeReferenceNode(typeArg) &&
                  ts.isIdentifier(typeArg.typeName)
                ) {
                  const typeName = typeArg.typeName.text;
                  const importPath = typeImports.get(typeName);
                  if (!importPath) {
                    throw new Error(
                      `Could not find import path for ${typeName}`
                    );
                  }
                  const value: ConfigMapNode = {
                    fnName,
                    typeName,
                    importPath,
                  };
                  const entry = configMap.get(key);
                  if (entry) {
                    entry.set(fnName, value);
                  } else {
                    configMap.set(key, new Map([[fnName, value]]));
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  function generateFunction(
    fnName: string,
    typeName: string,
    typeNode: ts.Type
  ): { fn: string; needEscape: boolean } {
    const props = typeNode.getProperties();
    let needEscape = false;

    const parts = props.map((p) => {
      const name = p.getName();
      const type = checker.getTypeOfSymbolAtLocation(p, p.valueDeclaration!);
      let val = `input.${name}`;
      if (type.flags & ts.TypeFlags.Number) {
        val = val;
      } else if (type.flags & ts.TypeFlags.String) {
        val = `escape(${val})`;
        needEscape = true;
      } else {
        // TODO: handle recursively
        val = `JSON.stringify(${val})`;
      }
      return `"${name}":\${${val}}`;
    });

    const fn = `export function ${fnName}(input: ${typeName}): string {
  return \`{${parts.join(",")}}\`;
}
`;

    return { fn, needEscape };
  }

  function generateAll() {
    extractTypeImports();
    extractConfigObject();

    for (const [outputFile, map] of configMap.entries()) {
      let fns = "";
      let imports = new Map<string, string>();
      let escapeRequired = false;

      for (const { fnName, typeName, importPath } of map.values()) {
        const absOutputPath = path.resolve(process.cwd(), outputFile);
        const absImportPath = path.resolve(
          process.cwd(),
          importPath.replace(/\.ts$/, "") + ".ts"
        );
        const relImport = path
          .relative(path.dirname(absOutputPath), absImportPath)
          .replace(/\\/g, "/");
        const src = program.getSourceFile(absImportPath);
        if (!src)
          throw new Error(`Cannot find import source: ${absImportPath}`);

        let targetType: ts.Type | undefined;

        ts.forEachChild(src, (node) => {
          if (ts.isInterfaceDeclaration(node) && node.name.text === typeName) {
            const sym = checker.getSymbolAtLocation(node.name);
            if (sym) {
              targetType = checker.getDeclaredTypeOfSymbol(sym);
            }
          }
        });

        if (!targetType) {
          console.error(`Could not find type ${typeName}`);
          continue;
        }

        const realImportPath = program.getCompilerOptions()
          .allowImportingTsExtensions
          ? relImport
          : relImport.replace(/\.ts$/, "");
        imports.set(typeName, realImportPath);

        const { fn, needEscape } = generateFunction(
          fnName,
          typeName,
          targetType
        );
        fns += fn;
        if (needEscape) {
          escapeRequired = true;
        }
      }

      let importCode = "";
      for (const [importNames, realImportPath] of imports) {
        importCode += `import { ${importNames} } from "${realImportPath}";\n`;
      }

      const code = `${importCode ? importCode + "\n" : ""}${fns}`;

      const genPath = path.resolve(process.cwd(), outputFile);
      fs.mkdirSync(path.dirname(genPath), { recursive: true });
      fs.writeFileSync(genPath, code, "utf8");
      console.log(`✅ Wrote: ${outputFile}`);
    }
  }
  generateAll();
}
