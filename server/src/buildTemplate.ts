import { TemplateMap } from "./types";
import path from 'path';
import Template from "./Template";

const getTemplate = (templateMap: TemplateMap, templatePath: string, id: string): Template => {
  const pathMap = templateMap.get(templatePath);
  if (!pathMap) {
    throw new Error(`No template at ${templatePath}`);
  }
  const element = pathMap.getTemplate(id);
  if (!element) {
    throw new Error(`No elements with id ${id} defined in ${templatePath}`)
  }
  return element;
}

const getTemplates = (routePath: string, templateMap: TemplateMap, template: Template): Template[] => {
  if (!template) {
    throw new Error('Failed to parse template');
  }
  const allRenderElements = template.getAllRenderElementsMatchingPath(routePath);

  const templateElements = allRenderElements
    .map((render) => getTemplate(templateMap, render.fullPath, render.templateId))

  const childTemplateContents =
    templateElements
      .map(template => getTemplates(routePath, templateMap, template))
      .flat();

  return [...templateElements, ...childTemplateContents];
}

const buildTemplate = (templatesPath: string, templateMap: TemplateMap, routePath: string): string => {
  const indexTemplatePath = path.join(templatesPath, 'index.html');
  const indexTemplate = templateMap.get(indexTemplatePath)?.getDocumentTemplate();
  if (!indexTemplate) {
    throw new Error(`No index template found at ${templatesPath}`);
  }
  const templates = getTemplates(routePath, templateMap, indexTemplate);
  indexTemplate.insertTemplates(templates);
  return indexTemplate.toString();
}

export default buildTemplate;