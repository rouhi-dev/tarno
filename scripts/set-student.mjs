/**
 * درج نام و شماره دانشجویی در README.
 *
 * اجرا:  node scripts/set-student.mjs "نام و نام خانوادگی" "شماره دانشجویی"
 */

import { readFileSync, writeFileSync } from 'node:fs';

const [name, id] = process.argv.slice(2);

if (!name || !id) {
  console.error('کاربرد: node scripts/set-student.mjs "نام و نام خانوادگی" "شماره دانشجویی"');
  process.exit(1);
}

const path = 'README.md';
let text = readFileSync(path, 'utf8');

const before = text;
text = text
  .replace('`<<< نام خود را اینجا بنویسید >>>`', name)
  .replace('`<<< شماره دانشجویی >>>`', id);

if (text === before) {
  console.log('جای‌نگهدار نام و شماره دانشجویی در README پیدا نشد (احتمالاً قبلاً پر شده است).');
  process.exit(0);
}

writeFileSync(path, text, 'utf8');
console.log(`ثبت شد — نام: ${name} | شماره دانشجویی: ${id}`);
console.log('گام بعد:  git commit -am "docs: درج مشخصات دانشجو در README" && git push');
