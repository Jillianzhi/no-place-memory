export const memoryPhotos = [
  { file: '01_幼儿园午休.jpg', width: 1200, height: 673 },
  { file: '02_厂区游乐场.jpg', width: 1200, height: 673 },
  { file: '03_照相馆合影.jpg', width: 1200, height: 802 },
  { file: '04_文化宫马戏.jpg', width: 1200, height: 675 },
  { file: '05_大院喷水池.jpg', width: 1200, height: 900 },
  { file: '06_旧教学楼旁.jpg', width: 1200, height: 1198 },
  { file: '07_乡镇大集市.jpg', width: 1200, height: 956 },
  { file: '08_车站蹦蹦床.jpg', width: 1194, height: 1200 },
  { file: '09_街边连廊道.jpg', width: 976, height: 1200 },
  { file: '10_老动物园笼.jpg', width: 1200, height: 833 },
  { file: '11_筒子楼过道.jpg', width: 926, height: 1200 },
  { file: '12_副食游乐屋.jpg', width: 1200, height: 1152 },
  { file: '13_公园旋转马.jpg', width: 868, height: 1200 },
  { file: '14_老式会客厅.jpg', width: 1177, height: 1200 },
  { file: '15_旧楼楼梯间.jpg', width: 1200, height: 845 },
  { file: '16_生日公告栏.jpg', width: 1200, height: 866 },
  { file: '17_校园走廊道.jpg', width: 1200, height: 832 },
  { file: '18_公园摇摇车.jpg', width: 968, height: 1200 },
  { file: '19_旧时滑滑梯.jpg', width: 1200, height: 1200 },
  { file: '20_童年小恐龙.jpg', width: 1200, height: 801 },
  { file: '21_闲置游乐场.jpg', width: 1200, height: 881 },
  { file: '22_旧时彩虹轨.jpg', width: 1200, height: 828 },
  { file: '23_澡堂游乐区.jpg', width: 1200, height: 786 },
  { file: '24_公园旋转椅.jpg', width: 1200, height: 850 },
  { file: '25_花园连廊道.jpg', width: 1200, height: 887 },
  { file: '26_老式小卖铺.jpg', width: 1200, height: 786 },
  { file: '27_学校的门口.jpg', width: 834, height: 1200 },
  { file: '28_小小报刊亭.jpg', width: 1200, height: 1001 },
  { file: '29_校园长走廊.jpg', width: 1200, height: 876 },
  { file: '30_桥洞石板路.jpg', width: 796, height: 1200 },
  { file: '31_废弃游乐屋.jpg', width: 789, height: 1200 },
  { file: '32_家门口乐园.jpg', width: 898, height: 1200 },
  { file: '33_杂货集市摊.jpg', width: 904, height: 1200 },
  { file: '34_飞椅游乐园.jpg', width: 1200, height: 891 },
  { file: '35_学校运动场.jpg', width: 1200, height: 848 },
  { file: '36_旧玩具商铺.jpg', width: 944, height: 1200 }
] as const;

export function getMemoryPhotoIdentity(index: number): {
  assetPath: string;
  visualName: string;
  title: string;
} {
  const photo = memoryPhotos[index];
  if (!photo) throw new RangeError(`Unknown memory photo index: ${index}`);
  const number = String(index + 1).padStart(2, '0');
  return {
    assetPath: `/assets/dreamcore/photos/${number}.jpg`,
    visualName: `memory_photo_${number}_visual`,
    title: photo.file.replace(/^\d+_/, '').replace(/\.jpg$/, '')
  };
}
