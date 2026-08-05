const fs = require('node:fs');
const path = require('node:path');
const XLSX = require('xlsx');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'samples', 'import-compat');
fs.mkdirSync(out, { recursive:true });

const files = {
  '01-标准UTF8.csv': '学号,姓名,性别,班级,专业\n000001,示例甲,女,计科一班,计算机科学与技术\n',
  '02-UTF8-BOM-WPS.csv': '\uFEFF学号,姓名,行政班名称,专业名称\n000002,示例乙,软件一班,软件工程\n',
  '03-标题行与别名.csv': '某高校2026级学生信息表\n生成日期：2026-08-05\n学生编号,学生姓名,行政班名称,院系名称\n000003,示例丙,人工智能一班,信息学院\n',
  '04-敏感字段空示例.csv': '学号,姓名,身份证号【敏感】,家庭详细地址【敏感】,家长联系电话【敏感】\n000004,示例丁,,,\n',
  '05-重复完全相同行.csv': '学号,姓名,班级\n000005,示例戊,大数据一班\n000005,示例戊,大数据一班\n',
  '06-重复学号冲突.csv': '学号,姓名,邮箱\n000006,示例己,a@example.edu.cn\n000006,示例己,b@example.edu.cn\n',
  '07-待确认记录.csv': '学号,姓名,班级\n,示例庚,物联网一班\n000008,,物联网二班\n',
  '08-非法值检查.csv': '学号,姓名,邮箱,出生日期,学制\n000009,示例辛,not-email,2026-13-40,99\n',
  '09-公式文本防护.csv': "学号,姓名,备注\n000010,示例壬,'=HYPERLINK(\"https://example.invalid\")\n",
  '10-LibreOffice-分号误用提示.csv': '学号;姓名;班级\n000011;示例癸;网络空间安全一班\n',
};
for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(out, name), content, 'utf8');

// Fixed GB18030 fixture bytes keep sample generation deterministic without another build dependency.
fs.writeFileSync(path.join(out, '11-GB18030.csv'), Buffer.from(
  '0ae6xSzQ1cP7LLDgvLYKMDAwMDEyLMq+wP3X0yzX1Lavu6/Su7DgCg==', 'base64'
));

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['导入说明'], ['请选择“学生名单”工作表']]), '说明');
XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
  ['某高校教务系统导出'], ['请勿修改学号格式'], ['学号', '姓名', '行政班名称', '专业名称'],
  ['000013', '示例丑', '机器人工程一班', '机器人工程'],
]), '学生名单');
XLSX.writeFile(workbook, path.join(out, '12-Excel-多工作表合并标题.xlsx'), { bookType:'xlsx' });

const legacy = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(legacy, XLSX.utils.aoa_to_sheet([
  ['学号', '姓名', '班级'], ['000014', '示例寅', '电子信息一班'],
]), 'Sheet1');
XLSX.writeFile(legacy, path.join(out, '13-Excel97-WPS兼容.xls'), { bookType:'biff8' });

console.log(`Generated ${Object.keys(files).length + 3} anonymized import samples in ${out}`);
