class DNA {
    constructor(canvas) {
        this.canvas = canvas;
        // 将DNA实例保存到canvas元素上
        canvas.__dna__ = this;
        this.ctx = canvas.getContext('2d');
        this.bases = ['A', 'T', 'C', 'G'];
        this.basePairs = {
            'A': 'T',
            'T': 'A',
            'C': 'G',
            'G': 'C'
        };
        this.baseWidth = 35;
        this.baseHeight = 45;
        this.strandSpacing = 120; // 两条链之间的固定距离
        this.originalSpacing = 120;
        this.denaturationProgress = 0;
        this.denaturationSpeed = 1 / (3 * 60); // 3秒完成动画，假设60fps
        this.isDenaturing = false;
        this.animationFrameId = null;
        
        // 存储生成的碱基序列
        this.dnaSequence = [];
        
        this.primer1Position = -1;  // 引物1的匹配位置
        this.primer2Position = -1;  // 引物2的匹配位置
        this.isAnnealing = false;   // 退火状态标记
        this.isDenatured = false;   // 变性完成标记
        
        // 添加延伸相关属性
        this.isExtending = false;
        this.extensionProgress = 0; // 延伸进度
        this.extensionSpeed = 1 / (8 * 60); // 6秒完成延伸，假设60fps
        this.polymerase1X = 0;
        this.polymerase2X = 0;
        this.polymeraseImg = new Image();
        this.polymeraseImg.src = 'polymerase.png'; // 需要准备一个DNA聚合酶的PNG图像
        
        // 延伸的碱基
        this.extendedBases1 = []; // 引物1延伸的碱基
        this.extendedBases2 = []; // 引物2延伸的碱基
        
        // 图像加载事件
        this.polymeraseImg.onload = () => {
            console.log("聚合酶图像加载成功");
            if (this.isExtending) {
                this.draw(); // 如果正在延伸状态，重新绘制
            }
        };
        
        // 图像加载错误处理
        this.polymeraseImg.onerror = () => {
            console.log("聚合酶图像加载失败，将使用圆形代替");
        };
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        // 获取所有区域的高度
        const titleHeight = document.querySelector('.title').offsetHeight;
        const topButtonsHeight = document.querySelector('.top-buttons').offsetHeight;
        const bottomButtonsHeight = document.querySelector('.bottom-buttons').offsetHeight;
        
        // 设置canvas的尺寸，考虑所有元素占用的空间
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - titleHeight - topButtonsHeight - bottomButtonsHeight;
        
        // 重新生成DNA序列
        this.generateDNASequence();
        
        this.draw();
    }
    
    // 生成随机DNA序列
    generateDNASequence() {
        const numBases = Math.floor(this.canvas.width / this.baseWidth);
        this.dnaSequence = [];
        
        for (let i = 0; i < numBases; i++) {
            const topBase = this.getRandomBase();
            const bottomBase = this.basePairs[topBase];
            this.dnaSequence.push({
                topBase,
                bottomBase
            });
        }
    }

    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 获取中心点
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // 绘制目标DNA标签
        this.ctx.font = 'bold 27px "Microsoft YaHei"';
        this.ctx.fillStyle = '#333';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText('目标DNA', centerX, centerY - this.strandSpacing/2 - 50);
        
        // 如果没有DNA序列，生成一个
        if (!this.dnaSequence || this.dnaSequence.length === 0) {
            this.generateDNASequence();
        }
        
        const numBases = this.dnaSequence.length;
        
        // 绘制保存的DNA序列
        for (let i = 0; i < numBases; i++) {
            const x = i * this.baseWidth;
            const { topBase, bottomBase } = this.dnaSequence[i];
            
            // 绘制上链
            const topY = centerY - this.strandSpacing/2;
            this.drawBase(x, topY, topBase, true);
            
            // 绘制下链
            const bottomY = centerY + this.strandSpacing/2;
            this.drawBase(x, bottomY, bottomBase, false);
            
            // 根据变性进度决定是否绘制氢键
            if (this.denaturationProgress < 1) {
                this.drawHydrogenBond(x, topY, bottomY, topBase, bottomBase);
            }
        }

        // 绘制DNA链的5'和3'端标签
        this.ctx.font = 'bold 22px Arial';
        this.ctx.fillStyle = 'black';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 上链左端 5'
        const topLeftX = 0;
        const topLeftY = centerY - this.strandSpacing/2 - 19; // 19像素约等于0.5cm
        this.ctx.fillText("5'", topLeftX + this.baseWidth/2, topLeftY);
        
        // 上链右端 3'
        const topRightX = (numBases - 1) * this.baseWidth;
        const topRightY = centerY - this.strandSpacing/2 - 19;
        this.ctx.fillText("3'", topRightX + this.baseWidth/2, topRightY);
        
        // 下链左端 3'
        const bottomLeftX = 0;
        const bottomLeftY = centerY + this.strandSpacing/2 + 69;
        this.ctx.fillText("3'", bottomLeftX + this.baseWidth/2, bottomLeftY);
        
        // 下链右端 5'
        const bottomRightX = (numBases - 1) * this.baseWidth;
        const bottomRightY = centerY + this.strandSpacing/2 + 69;
        this.ctx.fillText("5'", bottomRightX + this.baseWidth/2, bottomRightY);

        // 如果正在进行变性，更新进度
        if (this.isDenaturing) {
            this.denaturationProgress += this.denaturationSpeed;
            this.strandSpacing = this.originalSpacing * (1 + this.denaturationProgress * 0.8);
            
            if (this.denaturationProgress >= 1) {
                this.isDenaturing = false;
                this.isDenatured = true;
                cancelAnimationFrame(this.animationFrameId);
            } else {
                this.animationFrameId = requestAnimationFrame(() => this.draw());
            }
        }

        // 绘制引物1和引物2
        if (this.isAnnealing) {
            this.drawPrimer1();
            this.drawPrimer2();
        }
        
        // 如果正在进行延伸
        if (this.isExtending) {
            // 绘制延伸的碱基
            this.drawExtendedBases();
            
            // 最后绘制DNA聚合酶，确保它在最上层
            this.drawPolymerase();
            
            // 更新延伸进度
            if (this.extensionProgress < 1) {
                this.extensionProgress += this.extensionSpeed;
                console.log("更新延伸进度:", this.extensionProgress);
                
                if (this.extensionProgress >= 1) {
                    this.extensionProgress = 1; // 确保不会超过1
                    console.log("延伸完成");
                    // 完成动画后取消动画帧
                    cancelAnimationFrame(this.animationFrameId);
                } else {
                    // 继续动画
                    this.animationFrameId = requestAnimationFrame(() => this.draw());
                }
            }
        }
    }

    drawBase(x, y, base, isTop) {
        // 计算碱基的索引
        const baseIndex = Math.floor(x / this.baseWidth);
        
        // 使用索引设置颜色
        this.ctx.fillStyle = this.getBaseColorByIndex(baseIndex);
        
        // 绘制碱基矩形
        this.ctx.fillRect(x, y, this.baseWidth, this.baseHeight);
        
        // 添加黑色边框
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, this.baseWidth, this.baseHeight);
        
        // 绘制碱基字母
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(base, x + this.baseWidth/2, y + this.baseHeight/2);
    }

    // 添加辅助方法：将十六进制颜色转换为RGB值
    hexToRgb(hex) {
        // 移除#号
        hex = hex.replace('#', '');
        
        // 解析RGB值
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return [r, g, b];
    }

    drawHydrogenBond(x, topY, bottomY, topBase, bottomBase) {
        // 根据变性进度计算氢键的透明度
        const opacity = 1 - this.denaturationProgress;
        this.ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
        this.ctx.setLineDash([2, 2]);
        
        // 确定氢键数量
        const numBonds = (topBase === 'A' || topBase === 'T') ? 2 : 3;
        const bondSpacing = 8; // 氢键之间的间距
        
        // 计算第一个氢键的起始位置
        const startX = x + this.baseWidth/2;
        const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
        
        // 绘制氢键
        for (let i = 0; i < numBonds; i++) {
            const bondX = startX + firstBondOffset + i * bondSpacing;
            this.ctx.beginPath();
            this.ctx.moveTo(bondX, topY + this.baseHeight); // 从碱基底部开始
            this.ctx.lineTo(bondX, bottomY);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }

    getRandomBase() {
        return this.bases[Math.floor(Math.random() * this.bases.length)];
    }

    getBaseColor(base) {
        const colors = {
            'A': '#FF6B6B',
            'T': '#4ECDC4',
            'C': '#45B7D1',
            'G': '#96CEB4'
        };
        return colors[base];
    }

    startDenaturation() {
        if (!this.isDenaturing) {
            this.isDenaturing = true;
            this.denaturationProgress = 0;
            this.draw();
        }
    }

    // 检查碱基配对
    checkBasePair(base1, base2) {
        const pairs = {
            'A': 'T',
            'T': 'A',
            'C': 'G',
            'G': 'C'
        };
        return pairs[base1] === base2;
    }

    // 检查引物是否匹配（从右到左搜索）
    checkPrimerMatchReverse(primer, strand) {
        for (let i = strand.length - primer.length; i >= 0; i--) {
            let match = true;
            for (let j = 0; j < primer.length; j++) {
                if (!this.checkBasePair(primer[j], strand[i + j])) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return i;  // 返回匹配的起始位置
            }
        }
        return -1;  // 没有找到匹配
    }

    // 检查引物是否匹配（从左到右搜索）
    checkPrimerMatchLeftToRight(primer, strand) {
        for (let i = 0; i <= strand.length - primer.length; i++) {
            let match = true;
            for (let j = 0; j < primer.length; j++) {
                if (!this.checkBasePair(primer[j], strand[i + j])) {
                    match = false;
                    break;
                }
            }
            if (match) {
                return i;  // 返回匹配的起始位置
            }
        }
        return -1;  // 没有找到匹配
    }

    // 绘制引物
    drawPrimer(x, y, primer, isTop) {
        const primerHeight = this.baseHeight * 0.8;  // 引物高度略小于碱基
        const primerY = isTop ? y + this.baseHeight : y - primerHeight;
        
        // 绘制引物背景
        this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';  // 半透明黄色
        this.ctx.fillRect(x, primerY, this.baseWidth * primer.length, primerHeight);
        
        // 绘制引物碱基
        for (let i = 0; i < primer.length; i++) {
            const baseX = x + i * this.baseWidth;
            this.ctx.fillStyle = this.getBaseColor(primer[i]);
            this.ctx.fillRect(baseX, primerY, this.baseWidth, primerHeight);
            
            // 绘制碱基字母
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(primer[i], baseX + this.baseWidth/2, primerY + primerHeight/2);
        }
    }

    // 绘制引物1
    drawPrimer1() {
        if (this.primer1Position === -1) return;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const topY = centerY - this.strandSpacing/2;
        const primerY = topY + this.baseHeight + 21; // 21像素约等于0.3cm
        
        // 绘制引物背景
        this.ctx.fillStyle = 'rgba(244, 241, 187, 0.4)';  // 淡黄色半透明背景
        this.ctx.fillRect(
            this.primer1Position * this.baseWidth,
            primerY,
            this.baseWidth * window.primer1.length,
            this.baseHeight
        );
        
        // 绘制引物碱基和氢键
        for (let i = 0; i < window.primer1.length; i++) {
            const baseX = this.primer1Position * this.baseWidth + i * this.baseWidth;
            
            // 绘制引物碱基 - 使用淡黄色
            this.ctx.fillStyle = '#F1C40F'; // 更和谐的黄色(金黄色)
            this.ctx.fillRect(baseX, primerY, this.baseWidth, this.baseHeight);
            
            // 添加黑色边框
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(baseX, primerY, this.baseWidth, this.baseHeight);
            
            // 绘制碱基字母
            this.ctx.fillStyle = 'black'; // 黑色文字，在淡黄色背景上更易读
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(window.primer1[i], baseX + this.baseWidth/2, primerY + this.baseHeight/2);
            
            // 绘制氢键
            this.ctx.strokeStyle = 'black';
            this.ctx.setLineDash([2, 2]);
            
            // 确定氢键数量
            const numBonds = (window.primer1[i] === 'A' || window.primer1[i] === 'T') ? 2 : 3;
            const bondSpacing = 8; // 氢键之间的间距
            
            // 计算第一个氢键的起始位置
            const startX = baseX + this.baseWidth/2;
            const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
            
            // 绘制氢键
            for (let j = 0; j < numBonds; j++) {
                const bondX = startX + firstBondOffset + j * bondSpacing;
                this.ctx.beginPath();
                this.ctx.moveTo(bondX, topY + this.baseHeight);
                this.ctx.lineTo(bondX, primerY);
                this.ctx.stroke();
            }
            
            this.ctx.setLineDash([]);
        }
        
        // 添加引物1的5'和3'端标签
        this.ctx.font = 'bold 22px Arial';
        this.ctx.fillStyle = 'black';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 引物1右端 5'
        const primer1RightX = (this.primer1Position + window.primer1.length - 1) * this.baseWidth;
        const primer1LabelY = primerY + this.baseHeight + 11; // 11像素约等于0.3cm
        this.ctx.fillText("5'", primer1RightX + this.baseWidth/2, primer1LabelY);
        
        // 只有在没有开始延伸或者延伸进度为0时才绘制引物1左端的3'标签
        if (!this.isExtending || this.extensionProgress === 0) {
            // 引物1左端 3'
            const primer1LeftX = this.primer1Position * this.baseWidth;
            this.ctx.fillText("3'", primer1LeftX + this.baseWidth/2, primer1LabelY);
        }
    }

    // 绘制引物2
    drawPrimer2() {
        if (this.primer2Position === -1) return;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const bottomY = centerY + this.strandSpacing/2;
        const primerY = bottomY - this.baseHeight - 21; // 21像素约等于0.3cm
        
        // 绘制引物背景
        this.ctx.fillStyle = 'rgba(244, 241, 187, 0.4)';  // 淡黄色半透明背景
        this.ctx.fillRect(
            this.primer2Position * this.baseWidth,
            primerY,
            this.baseWidth * window.primer2.length,
            this.baseHeight
        );
        
        // 绘制引物碱基和氢键
        for (let i = 0; i < window.primer2.length; i++) {
            const baseX = this.primer2Position * this.baseWidth + i * this.baseWidth;
            
            // 绘制引物碱基 - 使用淡黄色
            this.ctx.fillStyle = '#F1C40F'; // 更和谐的黄色(金黄色)
            this.ctx.fillRect(baseX, primerY, this.baseWidth, this.baseHeight);
            
            // 添加黑色边框
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(baseX, primerY, this.baseWidth, this.baseHeight);
            
            // 绘制碱基字母
            this.ctx.fillStyle = 'black'; // 黑色文字，在淡黄色背景上更易读
            this.ctx.font = '24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(window.primer2[i], baseX + this.baseWidth/2, primerY + this.baseHeight/2);
            
            // 绘制氢键
            this.ctx.strokeStyle = 'black';
            this.ctx.setLineDash([2, 2]);
            
            // 确定氢键数量
            const numBonds = (window.primer2[i] === 'A' || window.primer2[i] === 'T') ? 2 : 3;
            const bondSpacing = 8; // 氢键之间的间距
            
            // 计算第一个氢键的起始位置
            const startX = baseX + this.baseWidth/2;
            const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
            
            // 绘制氢键
            for (let j = 0; j < numBonds; j++) {
                const bondX = startX + firstBondOffset + j * bondSpacing;
                this.ctx.beginPath();
                this.ctx.moveTo(bondX, primerY + this.baseHeight);
                this.ctx.lineTo(bondX, bottomY);
                this.ctx.stroke();
            }
            
            this.ctx.setLineDash([]);
        }
        
        // 添加引物2的5'和3'端标签
        this.ctx.font = 'bold 22px Arial';
        this.ctx.fillStyle = 'black';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 引物2左端 5'
        const primer2LeftX = this.primer2Position * this.baseWidth;
        const primer2LabelY = primerY - 11; // 11像素约等于0.3cm
        this.ctx.fillText("5'", primer2LeftX + this.baseWidth/2, primer2LabelY);
        
        // 只有在没有开始延伸或者延伸进度为0时才绘制引物2右端的3'标签
        if (!this.isExtending || this.extensionProgress === 0) {
            // 引物2右端 3'
            const primer2RightX = (this.primer2Position + window.primer2.length - 1) * this.baseWidth;
            this.ctx.fillText("3'", primer2RightX + this.baseWidth/2, primer2LabelY);
        }
    }

    // 绘制DNA聚合酶
    drawPolymerase() {
        if (!this.isExtending) return;
        
        const centerY = this.canvas.height / 2;
        const topY = centerY - this.strandSpacing/2;
        const bottomY = centerY + this.strandSpacing/2;
        
        // 引物1聚合酶位置
        const primer1Y = topY + this.baseHeight + 21;
        const polymerase1Y = (topY + primer1Y) / 2 + 10; // 聚合酶在引物1和DNA上链之间
        
        // 引物2聚合酶位置
        const primer2Y = bottomY - this.baseHeight - 21;
        const polymerase2Y = (bottomY + primer2Y) / 2 + 10; // 聚合酶在引物2和DNA下链之间
        
        // 根据延伸进度更新聚合酶位置
        if (this.extensionProgress > 0) {
            // 计算聚合酶1应该移动的最大距离
            const maxDistance1 = this.primer1Position * this.baseWidth;
            // 根据延伸进度计算当前位置
            this.polymerase1X = this.primer1Position * this.baseWidth - (maxDistance1 * this.extensionProgress);
            
            // 计算聚合酶2应该移动的最大距离
            const maxBases = this.dnaSequence.length;
            const maxDistance2 = (maxBases - this.primer2Position - window.primer2.length) * this.baseWidth;
            // 根据延伸进度计算当前位置
            this.polymerase2X = (this.primer2Position + window.primer2.length - 1) * this.baseWidth + (maxDistance2 * this.extensionProgress);
        }
        
        // 绘制DNA聚合酶图像
        // 如果图像不存在或未加载完成，绘制一个简单的圆形代表聚合酶
        if (!this.polymeraseImg.complete || this.polymeraseImg.naturalWidth === 0) {
            // 聚合酶1（上方）
            this.ctx.fillStyle = 'rgba(255, 127, 0, 0.7)';
            this.ctx.beginPath();
            this.ctx.arc(this.polymerase1X + this.baseWidth/2, polymerase1Y, 60, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 添加聚合酶文字
            this.ctx.fillStyle = 'black';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText("耐热", this.polymerase1X + this.baseWidth/2, polymerase1Y - 10);
            this.ctx.fillText("DNA聚合酶", this.polymerase1X + this.baseWidth/2, polymerase1Y + 10);
            
            // 聚合酶2（下方）
            this.ctx.fillStyle = 'rgba(255, 127, 0, 0.7)';
            this.ctx.beginPath();
            this.ctx.arc(this.polymerase2X + this.baseWidth/2, polymerase2Y, 60, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 添加聚合酶文字
            this.ctx.fillStyle = 'black';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText("耐热", this.polymerase2X + this.baseWidth/2, polymerase2Y - 10);
            this.ctx.fillText("DNA聚合酶", this.polymerase2X + this.baseWidth/2, polymerase2Y + 10);
        } else {
            // 绘制图像
            this.ctx.drawImage(this.polymeraseImg, this.polymerase1X, polymerase1Y - 10, 40, 40);
            this.ctx.drawImage(this.polymeraseImg, this.polymerase2X, polymerase2Y - 10, 40, 40);
            
            // 添加聚合酶文字
            this.ctx.fillStyle = 'black';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText("耐热", this.polymerase1X + 20, polymerase1Y + 15);
            this.ctx.fillText("DNA聚合酶", this.polymerase1X + 20, polymerase1Y + 35);
            this.ctx.fillText("耐热", this.polymerase2X + 20, polymerase2Y + 15);
            this.ctx.fillText("DNA聚合酶", this.polymerase2X + 20, polymerase2Y + 35);
        }
    }
    
    // 绘制延伸的碱基
    drawExtendedBases() {
        const centerY = this.canvas.height / 2;
        const topY = centerY - this.strandSpacing/2;
        const bottomY = centerY + this.strandSpacing/2;
        
        // 计算当前延伸进度下应该显示的碱基数量
        // 修正计算公式，使用实际的位置数量而不是百分比
        const maxExtend1 = this.primer1Position; // 最多可以延伸到DNA起始位置
        const basesToExtend1 = Math.floor(maxExtend1 * this.extensionProgress);
        
        const totalBases = this.dnaSequence.length;
        const maxExtend2 = totalBases - this.primer2Position - window.primer2.length; // 最多可以延伸到DNA结束位置
        const basesToExtend2 = Math.floor(maxExtend2 * this.extensionProgress);
        
        console.log("绘制延伸碱基 - 进度:", this.extensionProgress,
                  "maxExtend1:", maxExtend1, "basesToExtend1:", basesToExtend1,
                  "maxExtend2:", maxExtend2, "basesToExtend2:", basesToExtend2);
        
        // 绘制引物1延伸的碱基（左侧）
        // 当延伸进度为1时，确保绘制所有碱基，包括最左端
        const actualBasesToExtend1 = this.extensionProgress >= 0.99 ? maxExtend1 : basesToExtend1;
        
        for (let i = 0; i < actualBasesToExtend1; i++) {
            const position = this.primer1Position - i - 1;
            if (position >= 0) {
                const x = position * this.baseWidth;
                const base = this.dnaSequence[position].bottomBase; // 与上链互补的碱基
                
                // 绘制引物1延伸的碱基
                const extendedY = topY + this.baseHeight + 21; // 与引物1相同高度
                
                // 绘制碱基背景，使用基于位置的颜色
                this.ctx.fillStyle = this.getBaseColorByIndex(position);
                this.ctx.fillRect(x, extendedY, this.baseWidth, this.baseHeight);
                
                // 添加黑色边框
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, extendedY, this.baseWidth, this.baseHeight);
                
                // 绘制碱基字母
                this.ctx.fillStyle = 'white';
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(base, x + this.baseWidth/2, extendedY + this.baseHeight/2);
                
                // 绘制氢键
                this.ctx.strokeStyle = 'black';
                this.ctx.setLineDash([2, 2]);
                
                // 确定氢键数量
                const numBonds = (base === 'A' || base === 'T') ? 2 : 3;
                const bondSpacing = 8; // 氢键之间的间距
                
                // 计算第一个氢键的起始位置
                const startX = x + this.baseWidth/2;
                const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
                
                // 绘制氢键
                for (let j = 0; j < numBonds; j++) {
                    const bondX = startX + firstBondOffset + j * bondSpacing;
                    this.ctx.beginPath();
                    this.ctx.moveTo(bondX, topY + this.baseHeight);
                    this.ctx.lineTo(bondX, extendedY);
                    this.ctx.stroke();
                }
                
                this.ctx.setLineDash([]);
            }
        }
        
        // 绘制引物2延伸的碱基（右侧）
        // 当延伸进度为1时，确保绘制所有碱基，包括最右端
        const actualBasesToExtend2 = this.extensionProgress >= 0.99 ? maxExtend2 : basesToExtend2;
        
        for (let i = 0; i < actualBasesToExtend2; i++) {
            const position = this.primer2Position + window.primer2.length + i;
            if (position < totalBases) {
                const x = position * this.baseWidth;
                const base = this.dnaSequence[position].topBase; // 与下链互补的碱基
                
                // 绘制引物2延伸的碱基
                const extendedY = bottomY - this.baseHeight - 21; // 与引物2相同高度
                
                // 绘制碱基背景，使用基于位置的颜色
                this.ctx.fillStyle = this.getBaseColorByIndex(position);
                this.ctx.fillRect(x, extendedY, this.baseWidth, this.baseHeight);
                
                // 添加黑色边框
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, extendedY, this.baseWidth, this.baseHeight);
                
                // 绘制碱基字母
                this.ctx.fillStyle = 'white';
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(base, x + this.baseWidth/2, extendedY + this.baseHeight/2);
                
                // 绘制氢键
                this.ctx.strokeStyle = 'black';
                this.ctx.setLineDash([2, 2]);
                
                // 确定氢键数量
                const numBonds = (base === 'A' || base === 'T') ? 2 : 3;
                const bondSpacing = 8; // 氢键之间的间距
                
                // 计算第一个氢键的起始位置
                const startX = x + this.baseWidth/2;
                const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
                
                // 绘制氢键
                for (let j = 0; j < numBonds; j++) {
                    const bondX = startX + firstBondOffset + j * bondSpacing;
                    this.ctx.beginPath();
                    this.ctx.moveTo(bondX, extendedY + this.baseHeight);
                    this.ctx.lineTo(bondX, bottomY);
                    this.ctx.stroke();
                }
                
                this.ctx.setLineDash([]);
            }
        }
        
        // 绘制3'标签跟随延伸
        if (actualBasesToExtend1 > 0) {
            // 计算延伸链末端位置
            const leftmostExtendedPositionX = (this.primer1Position - actualBasesToExtend1) * this.baseWidth;
            const extendedY = topY + this.baseHeight + 21; // 与引物1相同高度
            
            // 绘制3'标签
            this.ctx.font = 'bold 22px Arial';
            this.ctx.fillStyle = 'black';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText("3'", leftmostExtendedPositionX + this.baseWidth/2, extendedY + this.baseHeight + 11);
        }
        
        if (actualBasesToExtend2 > 0) {
            // 计算延伸链末端位置
            const rightmostExtendedPositionX = (this.primer2Position + window.primer2.length + actualBasesToExtend2 - 1) * this.baseWidth;
            const extendedY = bottomY - this.baseHeight - 21; // 与引物2相同高度
            
            // 绘制3'标签
            this.ctx.font = 'bold 22px Arial';
            this.ctx.fillStyle = 'black';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText("3'", rightmostExtendedPositionX + this.baseWidth/2, extendedY - 11);
        }
    }

    // 重置系统
    reset() {
        // 取消可能正在进行的动画
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // 重置DNA相关属性
        this.strandSpacing = this.originalSpacing;
        this.denaturationProgress = 0;
        this.isDenaturing = false;
        this.isDenatured = false;
        
        // 重置引物相关属性
        this.primer1Position = -1;
        this.primer2Position = -1;
        this.isAnnealing = false;
        
        // 重置延伸相关属性
        this.isExtending = false;
        this.extensionProgress = 0;
        this.polymerase1X = 0;
        this.polymerase2X = 0;
        
        // 重新生成DNA序列
        this.generateDNASequence();
        
        // 重绘DNA
        this.draw();
    }

    // 添加新方法getBaseColorByIndex
    getBaseColorByIndex(index) {
        const numBases = this.dnaSequence.length;
        const startPoint = Math.floor((numBases - 22) / 2);
        const endPoint = startPoint + 22;
        
        if (index >= startPoint && index < endPoint) {
            return '#ff515c'; // 更美观的红色(鲜红色)
        } else {
            return '#00c2b4'; // 更美观的绿色(青绿色)
        }
    }

    // 退火过程
    anneal() {
        if (!this.isDenatured) {
            console.log("请先完成变性步骤");
            return;
        }
        
        this.isAnnealing = true;
        
        // 获取引物序列
        const primer1 = window.primer1 || 'ATGC';
        const primer2 = window.primer2 || 'ATGC';
        
        // 检查引物1匹配（从右到左搜索）
        this.primer1Position = this.checkPrimerMatchReverse(primer1, this.getTopStrand());
        
        // 检查引物2匹配（从左到右搜索）
        this.primer2Position = this.checkPrimerMatchLeftToRight(primer2, this.getBottomStrand());
        
        console.log("退火完成，引物位置:", {
            primer1Position: this.primer1Position,
            primer2Position: this.primer2Position
        });
        
        // 重绘DNA
        this.draw();
    }
}

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 初始化DNA
    const canvas = document.getElementById('dnaCanvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    const dna = new DNA(canvas);
    
    // 保存全局引用，如果window.dnaInstance变量存在
    if (typeof window.dnaInstance !== 'undefined') {
        window.dnaInstance = dna;
    }

    // 获取温度输入框和按钮
    const denatureTemp = document.getElementById('denatureTemp');
    const annealTemp = document.getElementById('annealTemp');
    const extendTemp = document.getElementById('extendTemp');
    const startProcessBtn = document.getElementById('startProcessBtn');
    const denatureBtn = document.getElementById('denatureBtn');
    const annealBtn = document.getElementById('annealBtn');
    const extendBtn = document.getElementById('extendBtn');
    const resetBtn = document.getElementById('resetBtn'); // 获取重置按钮

    // 确保页面加载时清空温度输入框
    if (denatureTemp) denatureTemp.value = '';
    if (annealTemp) annealTemp.value = '';
    if (extendTemp) extendTemp.value = '';

    // 跟踪温度设置状态
    let temperaturesSet = false;
    
    // 跟踪步骤完成状态
    let stepsCompleted = {
        denature: false,
        anneal: false,
        extend: false
    };

    // 设置温度按钮点击事件
    startProcessBtn.addEventListener('click', () => {
        // 检查是否输入了所有温度
        if (!denatureTemp.value.trim() || !annealTemp.value.trim() || !extendTemp.value.trim()) {
            alert('请输入所有温度值');
            return;
        }
        
        const denatureTempValue = parseFloat(denatureTemp.value);
        const annealTempValue = parseFloat(annealTemp.value);
        const extendTempValue = parseFloat(extendTemp.value);
        
        // 检查输入是否为有效数字
        if (isNaN(denatureTempValue) || isNaN(annealTempValue) || isNaN(extendTempValue)) {
            alert('请输入有效的温度值');
            return;
        }

        // 验证温度设置
        if (denatureTempValue < 94 || denatureTempValue > 96) {
            alert('请输入合适的变性温度！');
            return;
        }
        if (annealTempValue < 55 || annealTempValue > 68) {
            alert('请输入合适的退火温度！');
            return;
        }
        if (extendTempValue < 72 || extendTempValue > 78) {
            alert('请输入合适的延伸温度！');
            return;
        }

        // 所有温度设置正确
        temperaturesSet = true;
        
        // 更新按钮文本，显示对应的温度
        denatureBtn.textContent = `变性 (${denatureTempValue}°C)`;
        annealBtn.textContent = `退火 (${annealTempValue}°C)`;
        extendBtn.textContent = `延伸 (${extendTempValue}°C)`;
        
        alert('温度设置成功，请开始下一步操作');
    });

    // 变性按钮点击事件
    denatureBtn.addEventListener('click', () => {
        if (!temperaturesSet) {
            alert('请先设置并提交正确的温度');
            return;
        }
        
        stepsCompleted.denature = true;
        dna.startDenaturation();
    });

    // 退火按钮点击事件
    annealBtn.addEventListener('click', () => {
        if (!temperaturesSet) {
            alert('请先设置并提交正确的温度');
            return;
        }
        
        if (!stepsCompleted.denature) {
            alert('请先完成变性步骤');
            return;
        }

        // 检查引物设计是否完成
        if (!window.primer1 || !window.primer2) {
            alert('请先完成引物1和引物2的设计！');
            return;
        }

        // 检查引物1是否匹配上链（从右到左搜索）
        const topStrand = dna.dnaSequence.map(base => base.topBase).join('');
        dna.primer1Position = dna.checkPrimerMatchReverse(window.primer1, topStrand);
        
        if (dna.primer1Position === -1) {
            alert('引物1无法与DNA上链匹配！');
            return;
        }

        // 检查引物2是否匹配下链（从左到右搜索）
        const bottomStrand = dna.dnaSequence.map(base => base.bottomBase).join('');
        dna.primer2Position = dna.checkPrimerMatchLeftToRight(window.primer2, bottomStrand);
        
        if (dna.primer2Position === -1) {
            alert('引物2无法与DNA下链匹配！');
            return;
        }

        // 开始退火动画
        dna.isAnnealing = true;
        stepsCompleted.anneal = true;
        dna.draw();
    });

    // 延伸按钮点击事件
    extendBtn.addEventListener('click', () => {
        console.log("延伸按钮被点击");
        if (!temperaturesSet) {
            alert('请先设置并提交正确的温度');
            return;
        }
        
        if (!stepsCompleted.anneal) {
            alert('请先完成退火步骤');
            return;
        }
        
        console.log("设置聚合酶初始位置");
        // 设置聚合酶初始位置
        // 引物1左端位置（上链）
        dna.polymerase1X = dna.primer1Position * dna.baseWidth;
        
        // 引物2右端位置（下链）
        dna.polymerase2X = (dna.primer2Position + window.primer2.length - 1) * dna.baseWidth;
        
        console.log("聚合酶位置：", dna.polymerase1X, dna.polymerase2X);
        
        // 取消之前可能存在的动画帧
        if (dna.animationFrameId) {
            cancelAnimationFrame(dna.animationFrameId);
        }
        
        // 重置延伸进度
        dna.extensionProgress = 0;
        
        // 开始延伸动画
        dna.isExtending = true;
        stepsCompleted.extend = true;
        
        // 保存全局引用
        if (typeof window.dnaInstance !== 'undefined') {
            window.dnaInstance = dna;
        }
        
        dna.draw();
    });
    
    // 重置按钮点击事件
    resetBtn.addEventListener('click', () => {
        console.log("重置按钮被点击");
        
        // 重置温度设置状态
        temperaturesSet = false;
        
        // 重置步骤完成状态
        stepsCompleted = {
            denature: false,
            anneal: false,
            extend: false
        };
        
        // 重置引物
        window.primer1 = undefined;
        window.primer2 = undefined;
        
        // 重置温度输入框
        if (denatureTemp) denatureTemp.value = '';
        if (annealTemp) annealTemp.value = '';
        if (extendTemp) extendTemp.value = '';
        
        // 重置按钮文本
        denatureBtn.textContent = '变性';
        annealBtn.textContent = '退火';
        extendBtn.textContent = '延伸';
        
        // 重置DNA对象
        dna.reset();
        
        alert('系统已重置');
    });
}); 