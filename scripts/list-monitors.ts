import { Monitor } from 'node-screenshots';

console.log('正在获取所有显示器...');
const monitors = Monitor.all();

console.log('找到 ' + monitors.length + ' 个显示器:');
monitors.forEach((m, index) => {
  console.log(`${index + 1}. 显示器对象类型: ${typeof m}`);
  console.log(`   属性: ${Object.keys(m)}`);
  console.log(`   原始对象: ${JSON.stringify(m)}`);
  console.log('');
});
