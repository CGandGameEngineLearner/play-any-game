import { Window } from 'node-screenshots';

console.log('正在获取所有窗口...');
const windows = Window.all();

console.log('找到 ' + windows.length + ' 个窗口:');
windows.forEach((w, index) => {
  console.log(`${index + 1}. 窗口对象类型: ${typeof w}`);
  console.log(`   属性: ${Object.keys(w)}`);
  console.log(`   原始对象: ${JSON.stringify(w)}`);
  console.log('');
});
