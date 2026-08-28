# 《不在此处，不在别处》

Vite + TypeScript + Three.js 固定视角 3D 互动空间小游戏 Demo。

模型替换路径：

- `/assets/models/scene01_school/scene.glb`
- `/assets/models/scene02_station/scene.glb`
- `/assets/models/scene03_building/scene.glb`
- `/assets/models/scene04_projection/scene.glb`

没有模型时会自动使用程序化 3D 场景兜底。调试面板：`?debug=1`。

## 场景布局编辑器

访问 `/?scene=1&edit=1` 打开浏览器内置编辑器。场景编号可改为 `1` 至 `4`。

- 点击画面物体或使用物体下拉列表选中对象。
- 使用“移动 / 旋转 / 缩放”和三轴控件调整；手机端也可用每个轴的加减按钮与数值框。
- 调整结果按场景和横竖屏分别自动保存在浏览器中，并会应用到正常游戏模式。
- “复原物体”只清除当前物体调整，“复原本场景”清除当前场景当前屏幕方向的调整。
- “导出布局 / 导入布局”用于备份或迁移全部场景配置。
