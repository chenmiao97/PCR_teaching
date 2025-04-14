/**
 * cycle2.js - PCR循环2页面的JavaScript逻辑
 * 此文件处理循环2页面中DNA双链的显示和交互
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // 定义保存DNA序列的变量，用于确保与循环1保持一致
    let storedDnaSequence = null;
    
    // 引物位置变量
    let primer1Pos = -1;
    let primer2Pos = -1;
    
    // 从URL参数获取DNA序列和引物数据
    function getURLParameters() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const dnaParam = urlParams.get('dnaSequence');
            if (dnaParam) {
                storedDnaSequence = JSON.parse(decodeURIComponent(dnaParam));
            }
            
            // 获取引物数据
            const primer1 = urlParams.get('primer1');
            const primer2 = urlParams.get('primer2');
            
            // 获取引物位置数据
            const rawPrimer1Pos = urlParams.get('primer1Pos');
            const rawPrimer2Pos = urlParams.get('primer2Pos');
            console.log("原始引物位置参数:", {
                rawPrimer1Pos: rawPrimer1Pos,
                rawPrimer2Pos: rawPrimer2Pos
            });
            
            primer1Pos = parseInt(rawPrimer1Pos) || -1;
            primer2Pos = parseInt(rawPrimer2Pos) || -1;
            
            // 设置全局引物变量
            window.primer1 = primer1 ? primer1 : '';
            window.primer2 = primer2 ? primer2 : '';
            
            // 获取温度设置
            const denatureTemp = urlParams.get('denatureTemp') || 95;
            const annealTemp = urlParams.get('annealTemp') || 60;
            const extendTemp = urlParams.get('extendTemp') || 72;
            
            // 保存温度设置
            window.denatureTemp = denatureTemp;
            window.annealTemp = annealTemp;
            window.extendTemp = extendTemp;
            
            // 更新按钮标签
            updateTemperatureLabels(denatureTemp, annealTemp, extendTemp);
            
            console.log("URL参数解析完成", {
                primer1Length: window.primer1.length, 
                primer2Length: window.primer2.length,
                primer1Pos: primer1Pos,
                primer2Pos: primer2Pos,
                temperatures: {
                    denature: denatureTemp,
                    anneal: annealTemp,
                    extend: extendTemp
                },
                fullURL: window.location.href
            });
        } catch (e) {
            console.error("无法解析URL参数:", e);
        }
    }
    
    // 更新按钮温度标签
    function updateTemperatureLabels(denatureTemp, annealTemp, extendTemp) {
        const denatureBtn = document.getElementById('denatureBtn');
        const annealBtn = document.getElementById('annealBtn');
        const extendBtn = document.getElementById('extendBtn');
        
        if (denatureBtn) denatureBtn.textContent = `变性 (${denatureTemp}°C)`;
        if (annealBtn) annealBtn.textContent = `退火 (${annealTemp}°C)`;
        if (extendBtn) extendBtn.textContent = `延伸 (${extendTemp}°C)`;
    }

    // 初始化DNA画布和处理按钮事件
    function initializePage() {
        // 获取URL参数
        getURLParameters();
        
        // 初始化DNA
        const canvas = document.getElementById('dnaCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        // 使用原始的DNA类，然后修改其draw方法
        const dna = new DNA(canvas);
        
        // 保存原始的draw方法
        const originalDraw = dna.draw.bind(dna);
        
        // 添加变性动画相关属性
        dna.isDenaturing = false;  // 是否正在变性中
        dna.isDenatured = false;   // 是否已变性
        dna.hydrogenBondOpacity = 1; // 氢键透明度
        dna.verticalGapMultiplier = 1; // 链间距离倍数
        dna.originalBaseHeight = dna.baseHeight; // 原始碱基高度
        
        // 添加退火动画相关属性
        dna.isAnnealing = false;  // 是否正在退火中
        dna.isAnnealed = false;   // 是否已退火
        dna.annealingProgress = 0; // 退火进度
        
        // 修改draw方法，在绘制碱基时保持黑色边框不变
        dna.draw = function() {
            // 清空画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 计算画布中心点
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            
            // 如果没有DNA序列，生成一个
            if (!this.dnaSequence || this.dnaSequence.length === 0) {
                this.generateDNASequence();
            }
            
            const numBases = this.dnaSequence.length;
            
            // 保存原始绘制方法以便恢复
            const originalDrawBase = this.drawBase;
            
            // 修改drawBase方法，确保始终有黑色边框
            this.drawBase = function(x, y, base, isTopChain) {
                // 调用原始方法绘制碱基
                originalDrawBase.call(this, x, y, base, isTopChain);
                
                // 确保线型为实线
                this.ctx.setLineDash([]);
                
                // 添加黑色边框（保持不变，不受动画影响）
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, this.baseWidth, this.baseHeight);
            };
            
            // 配置各链间距
            // 默认垂直间距
            const defaultVerticalGap = 100;
            
            // 链之间的垂直间距 - 考虑动画过程中的变化
            const verticalGapMultiplier = this.verticalGapMultiplier || 1;
            
            // 初始状态下第2条链和第3条链之间的距离减少到50%
            // 中间间距保持不变，不受变性动画影响
            const middleGapReduction = 0.5; // 始终减少50%
            const middleGap = defaultVerticalGap * (1 - middleGapReduction);
            
            // 上部和下部链间的垂直间距会在变性过程中增大
            const verticalGap = defaultVerticalGap * verticalGapMultiplier;
            
            // 额外间距，使整体布局更加均衡（保持第1和第2链组、第3和第4链组整体的位置）
            const extraGap = 30; // 固定值，不受动画影响
            
            // 计算四条链的Y坐标
            const chain2Y = centerY - middleGap/2 - extraGap; // 第2条链
            const chain3Y = centerY + middleGap/2 + extraGap; // 第3条链
            const chain1Y = chain2Y - verticalGap; // 第1条链
            const chain4Y = chain3Y + verticalGap; // 第4条链
            
            // 计算引物1截断点位置 - 从URL中获取引物1位置
            console.log(`使用的引物1位置(未处理): ${primer1Pos}, 碱基总数: ${numBases}`);
            console.log(`使用的引物2位置(未处理): ${primer2Pos}, 碱基总数: ${numBases}`);
            
            // 替代方案：如果primer1Pos无效，使用默认值
            const effectivePrimer1Pos = (primer1Pos !== -1 && !isNaN(primer1Pos)) ? 
                primer1Pos : 
                Math.floor(numBases / 3);
            
            // 将引物1位置向右移动3个碱基（而不是向左）
            const adjustedPrimer1Pos = Math.min(numBases - 1, effectivePrimer1Pos + 3);
            
            // 替代方案：如果primer2Pos无效，使用默认值
            const effectivePrimer2Pos = (primer2Pos !== -1 && !isNaN(primer2Pos)) ? 
                primer2Pos : 
                Math.floor(numBases * 2 / 3);
            
            console.log(`最终使用的引物1位置: ${effectivePrimer1Pos}, 调整后(右移3位): ${adjustedPrimer1Pos}, 原始值: ${primer1Pos}`);
            console.log(`最终使用的引物2位置: ${effectivePrimer2Pos}, 原始值: ${primer2Pos}`);
            
            // 计算引物长度 - 默认为4个碱基
            const primer1Length = window.primer1 ? window.primer1.length : 4;
            const primer2Length = window.primer2 ? window.primer2.length : 4;
            
            console.log(`引物1内容: "${window.primer1}", 长度: ${primer1Length}`);
            console.log(`引物2内容: "${window.primer2}", 长度: ${primer2Length}`);
            
            // 绘制四条链
            for (let i = 0; i < numBases; i++) {
                const x = i * this.baseWidth;
                const { topBase, bottomBase } = this.dnaSequence[i];
                
                // 1. 绘制第1条链 (原始上链)
                this.drawBase(x, chain1Y, topBase, true);
                
                // 2. 绘制第2条链 (与上链匹配的新链)
                // 只绘制第2条链在引物1位置左侧的碱基（不包括引物1位置）
                if (i < adjustedPrimer1Pos - primer1Length + 1) {
                    // 正常绘制引物1左侧的碱基
                    this.drawBase(x, chain2Y, this.basePairs[topBase], false);
                    
                    // 为这些碱基绘制氢键
                    this.drawCustomHydrogenBond(x, chain1Y, chain2Y, topBase, this.basePairs[topBase]);
                } 
                // 单独处理引物1位置的碱基 - 需要高亮显示
                else if (i >= adjustedPrimer1Pos - primer1Length + 1 && i <= adjustedPrimer1Pos) {
                    // 增加调试日志
                    if (i === adjustedPrimer1Pos - primer1Length + 1) {
                        console.log(`绘制引物1的第一个碱基，位置: ${i}`);
                    }
                    if (i === adjustedPrimer1Pos) {
                        console.log(`绘制引物1的最后一个碱基，位置: ${i}`);
                    }
                    
                    // 用高亮样式显示引物位置的碱基
                    this.drawHighlightedBase(x, chain2Y, this.basePairs[topBase], false);
                    
                    // 为引物位置的碱基绘制氢键
                    this.drawCustomHydrogenBond(x, chain1Y, chain2Y, topBase, this.basePairs[topBase]);
                }
                
                // 3. 绘制第3条链 (与第4条链互补)
                // 只绘制第3条链在引物2位置右侧的碱基
                if (i >= effectivePrimer2Pos) {
                    // 确定要显示的碱基 - 与第4条链互补
                    // 第4条链显示的是this.basePairs[topBase]，所以第3条链应显示与其互补的碱基，即topBase
                    const displayBase = topBase;
                    
                    // 检查是否是引物2位置的碱基 - 需要高亮显示
                    // 注意：引物2是从左向右延伸(5'->3')，所以从effectivePrimer2Pos开始
                    const isInPrimer2Range = (effectivePrimer2Pos <= i && i < effectivePrimer2Pos + primer2Length);
                    
                    // 增加调试日志
                    if (i >= effectivePrimer2Pos - 1 && i <= effectivePrimer2Pos + primer2Length) {
                        console.log(`位置 ${i} 是否在引物2范围内: ${isInPrimer2Range}, 范围: ${effectivePrimer2Pos} ~ ${effectivePrimer2Pos + primer2Length - 1}`);
                    }
                    
                    if (isInPrimer2Range) {
                        // 用高亮样式显示引物位置的碱基
                        this.drawHighlightedBase(x, chain3Y, displayBase, false);
                    } else {
                        // 正常绘制其他碱基
                        this.drawBase(x, chain3Y, displayBase, false);
                    }
                    
                    // 调试信息 - 在控制台显示正在绘制的碱基位置
                    if (i === effectivePrimer2Pos) {
                        console.log(`绘制第3条链的第一个碱基，位置: ${i}, effectivePrimer2Pos: ${effectivePrimer2Pos}`);
                    }
                } else {
                    // 调试信息 - 跳过的碱基
                    if (i === effectivePrimer2Pos - 1) {
                        console.log(`跳过第3条链在位置 ${i} 及之前的碱基，effectivePrimer2Pos: ${effectivePrimer2Pos}`);
                    }
                }
                
                // 4. 绘制第4条链 (与第1条链互补)
                this.drawBase(x, chain4Y, this.basePairs[topBase], true);
                
                // 恢复第3条链和第4条链之间的氢键
                if (i >= effectivePrimer2Pos) {
                    // 第3条链现在显示topBase，第4条链显示this.basePairs[topBase]，它们互补
                    this.drawCustomHydrogenBond(x, chain3Y, chain4Y, topBase, this.basePairs[topBase]);
                }
            }
            
            // 绘制链的5'和3'端标签
            this.ctx.font = 'bold 22px Arial';
            this.ctx.fillStyle = 'black';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 第1条链 5'和3'标签
            this.ctx.fillText("5'", this.baseWidth/2, chain1Y - 25);
            this.ctx.fillText("3'", (numBases - 0.5) * this.baseWidth, chain1Y - 25);
            
            // 第2条链 3'和5'标签 (方向与第1条链相反)
            // 注意：第2条链可能不完整，所以标签位置需要调整
            this.ctx.fillText("3'", this.baseWidth/2, chain2Y + this.baseHeight + 25);
            // 第2条链的5'标签位于引物1位置的左侧，向右移动4个碱基
            this.ctx.fillText("5'", (adjustedPrimer1Pos - primer1Length + 0.5 + 4) * this.baseWidth, chain2Y + this.baseHeight + 25);
            
            // 第3条链 3'和5'标签 - 注意：第3条链也不完整，只显示引物2位置右侧的碱基
            this.ctx.fillText("5'", (effectivePrimer2Pos + 0.5) * this.baseWidth, chain3Y - 25);
            this.ctx.fillText("3'", (numBases - 0.5) * this.baseWidth, chain3Y - 25);
            
            // 第4条链 5'和3'标签 (方向与第3条链相反)
            this.ctx.fillText("3'", this.baseWidth/2, chain4Y + this.baseHeight + 25);
            this.ctx.fillText("5'", (numBases - 0.5) * this.baseWidth, chain4Y + this.baseHeight + 25);
            
            console.log("绘制四条DNA链完成");
            
            // 恢复原始的drawBase方法
            this.drawBase = originalDrawBase;
            
            // 如果正在退火或已退火，绘制引物1
            if ((this.isAnnealing || this.isAnnealed) && (this.annealingProgress > 0)) {
                this.drawPrimersOnTemplates(adjustedPrimer1Pos, primer1Length);
            }
            
            // 如果正在延伸或已延伸，绘制延伸的碱基
            if ((this.isExtending || this.isExtended) && this.extensionProgress > 0) {
                this.drawExtendedBases(adjustedPrimer1Pos, primer1Length);
            }
        };
        
        // 添加自定义氢键绘制方法
        dna.drawCustomHydrogenBond = function(x, topY, bottomY, topBase, bottomBase) {
            // 设置氢键样式，支持变性期间的透明度变化
            const opacity = this.hydrogenBondOpacity !== undefined ? this.hydrogenBondOpacity : 1;
            this.ctx.strokeStyle = `rgba(0, 0, 0, ${0.7 * opacity})`;
            this.ctx.setLineDash([2, 2]);
            
            // 如果已完全变性（透明度为0），则不绘制氢键
            if (opacity <= 0) {
                // 重置线型为实线，以免影响后续绘制操作
                this.ctx.setLineDash([]);
                return;
            }
            
            // 确定氢键数量 (A-T有2个，G-C有3个)
            const numBonds = (topBase === 'A' || topBase === 'T') ? 2 : 3;
            const bondSpacing = 8; // 氢键之间的间距
            
            // 计算第一个氢键的起始位置
            const startX = x + this.baseWidth/2;
            const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
            
            // 绘制氢键
            for (let i = 0; i < numBonds; i++) {
                const bondX = startX + firstBondOffset + i * bondSpacing;
                this.ctx.beginPath();
                this.ctx.moveTo(bondX, topY + this.baseHeight);
                this.ctx.lineTo(bondX, bottomY);
                this.ctx.stroke();
            }
            
            // 重置虚线样式，使用空数组确保是实线
            this.ctx.setLineDash([]);
        };
        
        // 添加自定义方法绘制高亮碱基
        dna.drawHighlightedBase = function(x, y, base, isTopChain) {
            // 绘制引物碱基 - 使用金黄色背景（与循环1保持一致）
            this.ctx.fillStyle = '#F1C40F'; // 更和谐的黄色(金黄色)
            this.ctx.fillRect(x, y, this.baseWidth, this.baseHeight);
            
            // 确保线型为实线
            this.ctx.setLineDash([]);
            
            // 添加黑色边框
            this.ctx.strokeStyle = 'black';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, y, this.baseWidth, this.baseHeight);
            
            // 绘制碱基文字 (黑色文字，在金黄色背景上更易读)
            const xCenter = x + this.baseWidth / 2;
            const yCenter = y + this.baseHeight / 2;
            this.ctx.font = '24px Arial';  // 与循环1相同的字体大小
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = 'black';  // 黑色文字
            this.ctx.fillText(base, xCenter, yCenter);
        };
        
        // 添加绘制引物1退火到模板链的方法
        dna.drawPrimersOnTemplates = function(primerPos, primerLength) {
            // 计算各链的Y坐标位置
            const centerY = this.canvas.height / 2;
            const defaultVerticalGap = 100;
            const verticalGapMultiplier = this.verticalGapMultiplier || 1;
            const middleGapReduction = 0.5;
            const middleGap = defaultVerticalGap * (1 - middleGapReduction);
            const verticalGap = defaultVerticalGap * verticalGapMultiplier;
            const extraGap = 30;
            
            // 计算四条链的Y坐标
            const chain2Y = centerY - middleGap/2 - extraGap; // 第2条链
            const chain3Y = centerY + middleGap/2 + extraGap; // 第3条链
            const chain1Y = chain2Y - verticalGap; // 第1条链
            const chain4Y = chain3Y + verticalGap; // 第4条链
            
            // 计算引物位置
            const primer1StartX = (primerPos - primerLength + 1) * this.baseWidth;
            const primerY1 = chain1Y + this.baseHeight + 32; // 21像素约等于0.9cm，显示在第1条链下方
            const primerY3 = chain3Y + this.baseHeight + 32; // 显示在第3条链下方
            
            // 设置引物的显示进度（0-1）
            const progress = this.annealingProgress || 1;
            
            // 获取引物序列
            const primer1Sequence = window.primer1 || 'ATGC'; // 默认使用ATGC
            
            // 绘制引物1在第1条链上
            this.drawPrimerOnTemplate(primer1StartX, primerY1, primer1Sequence, chain1Y, progress);
            
            // 绘制引物1在第3条链上
            this.drawPrimerOnTemplate(primer1StartX, primerY3, primer1Sequence, chain3Y, progress);
            
            // 绘制引物2
            // 计算引物2位置
            const numBases = this.dnaSequence.length;
            const effectivePrimer2Pos = (primer2Pos !== -1 && !isNaN(primer2Pos)) ? 
                primer2Pos : Math.floor(numBases * 2 / 3);
            const primer2Length = window.primer2 ? window.primer2.length : 4;
            const primer2StartX = effectivePrimer2Pos * this.baseWidth;
            
            // 引物2显示在链的上方0.9cm处
            const primerY2 = chain2Y - 53; // 21像素约等于0.9cm，显示在第2条链上方
            const primerY4 = chain4Y - 53; // 显示在第4条链上方
            
            // 获取引物2序列
            const primer2Sequence = window.primer2 || 'TACG'; // 默认使用TACG
            
            // 绘制引物2在第2条链上
            this.drawPrimerOnTemplate(primer2StartX, primerY2, primer2Sequence, chain2Y, progress, true);
            
            // 绘制引物2在第4条链上
            this.drawPrimerOnTemplate(primer2StartX, primerY4, primer2Sequence, chain4Y, progress, true);
        };
        
        // 添加在特定位置绘制引物的方法
        dna.drawPrimerOnTemplate = function(x, y, primerSequence, templateY, progress, isUpDirection = false) {
            const primerHeight = this.baseHeight * 1; // 引物高度
            
            // 引物背景 - 淡黄色半透明
            this.ctx.fillStyle = 'rgba(244, 241, 187, 0.4)';
            this.ctx.fillRect(x, y, this.baseWidth * primerSequence.length * progress, primerHeight);
            
            // 遍历引物序列中的碱基
            for (let i = 0; i < Math.ceil(primerSequence.length * progress); i++) {
                const baseX = x + i * this.baseWidth;
                const base = primerSequence[i];
                
                // 绘制引物碱基 - 使用金黄色
                this.ctx.fillStyle = '#F1C40F'; // 金黄色
                this.ctx.fillRect(baseX, y, this.baseWidth, primerHeight);
                
                // 添加黑色边框
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(baseX, y, this.baseWidth, primerHeight);
                
                // 绘制碱基字母
                this.ctx.fillStyle = 'black'; // 黑色文字
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(base, baseX + this.baseWidth/2, y + primerHeight/2);
                
                // 绘制氢键
                // 确定氢键数量 (A-T有2个，G-C有3个)
                const numBonds = (base === 'A' || base === 'T') ? 2 : 3;
                const bondSpacing = 8; // 氢键之间的间距
                
                // 计算第一个氢键的起始位置
                const startX = baseX + this.baseWidth/2;
                const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
                
                // 设置氢键样式
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.setLineDash([2, 2]);
                
                // 绘制氢键 - 根据方向调整
                for (let j = 0; j < numBonds; j++) {
                    const bondX = startX + firstBondOffset + j * bondSpacing;
                    this.ctx.beginPath();
                    if (isUpDirection) {
                        // 引物在链的上方，氢键向下
                        this.ctx.moveTo(bondX, y + primerHeight);
                        this.ctx.lineTo(bondX, templateY);
                    } else {
                        // 引物在链的下方，氢键向上
                        this.ctx.moveTo(bondX, templateY + this.baseHeight);
                        this.ctx.lineTo(bondX, y);
                    }
                    this.ctx.stroke();
                }
                
                // 重置虚线样式
                this.ctx.setLineDash([]);
            }
            
            // 添加引物的5'和3'端标签，只在进度完成时显示
            if (progress >= 1) {
                this.ctx.font = 'bold 22px Arial';
                this.ctx.fillStyle = 'black';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                
                const textOffset = isUpDirection ? -25 : 25; // 根据方向调整文本位置，增加距离
                
                // 根据方向确定标签的位置
                if (isUpDirection) {
                    // 引物2（在上方）的标签：左端5'，右端3'
                    // 引物右端 3'
                    const primerRightX = x + primerSequence.length * this.baseWidth - this.baseWidth/2;
                    this.ctx.fillText("3'", primerRightX, y + primerHeight/2 + textOffset);
                    
                    // 引物左端 5'
                    this.ctx.fillText("5'", x + this.baseWidth/2, y + primerHeight/2 + textOffset);
                } else {
                    // 引物1（在下方）的标签：左端3'，右端5'
                    // 引物右端 5'
                    const primerRightX = x + primerSequence.length * this.baseWidth - this.baseWidth/2;
                    this.ctx.fillText("5'", primerRightX, y + primerHeight/2 + textOffset);
                    
                    // 引物左端 3'
                    this.ctx.fillText("3'", x + this.baseWidth/2, y + primerHeight/2 + textOffset);
                }
            }
        };
        
        // 添加绘制延伸碱基的方法
        dna.drawExtendedBases = function(primerPos, primerLength) {
            // 计算各链的Y坐标位置
            const centerY = this.canvas.height / 2;
            const defaultVerticalGap = 100;
            const verticalGapMultiplier = this.verticalGapMultiplier || 1;
            const middleGapReduction = 0.5;
            const middleGap = defaultVerticalGap * (1 - middleGapReduction);
            const verticalGap = defaultVerticalGap * verticalGapMultiplier;
            const extraGap = 30;
            
            // 计算四条链的Y坐标
            const chain2Y = centerY - middleGap/2 - extraGap; // 第2条链
            const chain3Y = centerY + middleGap/2 + extraGap; // 第3条链
            const chain1Y = chain2Y - verticalGap; // 第1条链
            const chain4Y = chain3Y + verticalGap; // 第4条链
            
            // 计算延伸链的Y坐标
            const extensionChainY1 = chain1Y + this.baseHeight + 32; // 第1条链下方32像素
            const extensionChainY2 = chain2Y - 53; // 第2条链上方53像素
            const extensionChainY3 = chain3Y + this.baseHeight + 32; // 第3条链下方32像素
            const extensionChainY4 = chain4Y - 53; // 第4条链上方53像素
            
            // 获取延伸进度
            const progress = this.extensionProgress || 0;
            
            // 计算引物1延伸的起始点和长度
            const startPos1 = primerPos - primerLength + 1;
            const extensionLength1 = startPos1; // 延伸到链的最左端
            
            // 计算当前延伸到的位置
            const currentExtensionLength1 = Math.floor(extensionLength1 * progress);
            
            // 从引物1向左端延伸，形成与第1条链匹配的新链
            this.drawExtension(startPos1, currentExtensionLength1, extensionChainY1, chain1Y, false);
            
            // 从引物1向左端延伸，形成与第3条链匹配的新链
            this.drawExtension(startPos1, currentExtensionLength1, extensionChainY3, chain3Y, false, false, true);
            
            // 获取引物2位置
            const numBases = this.dnaSequence.length;
            const effectivePrimer2Pos = (primer2Pos !== -1 && !isNaN(primer2Pos)) ? 
                primer2Pos : Math.floor(numBases * 2 / 3);
            const primer2Length = window.primer2 ? window.primer2.length : 4;
            
            // 计算引物2延伸的起始点和长度
            const startPos2 = effectivePrimer2Pos + primer2Length - 1;
            const extensionLength2 = numBases - startPos2 - 1; // 延伸到链的最右端
            
            // 计算当前延伸到的位置
            const currentExtensionLength2 = Math.floor(extensionLength2 * progress);
            
            // 从引物2向右端延伸，形成与第4条链匹配的新链
            this.drawExtension(startPos2, currentExtensionLength2, extensionChainY4, chain4Y, true);
            
            // 从引物2向右端延伸，形成与第2条链匹配的新链
            this.drawExtension(startPos2, currentExtensionLength2, extensionChainY2, chain2Y, true, true);
            
            // 计算引物1位置
            const primer1StartX = (primerPos - primerLength + 1) * this.baseWidth;
            
            // 计算引物2位置
            const primer2StartX = effectivePrimer2Pos * this.baseWidth;
            
            // 只在动画未完成时绘制DNA聚合酶
            if (progress < 1) {
                // 绘制DNA聚合酶 - 使用橙色圆形
                // 设置DNA聚合酶Y坐标
                const polymeraseY1 = chain1Y + 30; // 在第1条链上方
                const polymeraseY2 = chain3Y + 30; // 在第3条链上方
                const polymeraseY3 = chain2Y + this.baseHeight - 30; // 在第2条链下方
                const polymeraseY4 = chain4Y + this.baseHeight - 30; // 在第4条链下方
                
                // 计算DNA聚合酶的移动位置
                // 从左向右移动的聚合酶 (引物1处的聚合酶)
                const leftPolymeraseStartX = primer1StartX + this.baseWidth/2;
                const leftPolymeraseEndX = 0 + this.baseWidth/2; // 移动到最左端
                const currentLeftX = leftPolymeraseStartX + (leftPolymeraseEndX - leftPolymeraseStartX) * progress;
                
                // 从右向左移动的聚合酶 (引物2处的聚合酶)
                const rightPolymeraseStartX = primer2StartX + this.baseWidth/2;
                const rightPolymeraseEndX = this.canvas.width - this.baseWidth/2; // 移动到最右端
                const currentRightX = rightPolymeraseStartX + (rightPolymeraseEndX - rightPolymeraseStartX) * progress;
                
                // 聚合酶大小和效果设置
                const polymeraseRadius = 50; // 增大聚合酶大小
                const glowSize = 1; // 发光效果大小
                
                // 绘制四个DNA聚合酶
                // 第1个DNA聚合酶 - 在第1条链边移动
                // 添加光晕效果
                const gradient1 = this.ctx.createRadialGradient(
                    currentLeftX, polymeraseY1, polymeraseRadius-glowSize,
                    currentLeftX, polymeraseY1, polymeraseRadius+glowSize
                );
                gradient1.addColorStop(0, 'rgba(255, 127, 0, 0.7)');
                gradient1.addColorStop(1, 'rgba(255, 127, 0, 0)');
                this.ctx.beginPath();
                this.ctx.arc(currentLeftX, polymeraseY1, polymeraseRadius+glowSize, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient1;
                this.ctx.fill();
                
                // 绘制聚合酶本体
                this.ctx.beginPath();
                this.ctx.arc(currentLeftX, polymeraseY1, polymeraseRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 127, 0, 0.7)';
                this.ctx.fill();
                
                // 添加DNA聚合酶文字标签
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillStyle = 'black';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('耐热', currentLeftX, polymeraseY1 - 10);
                this.ctx.fillText('DNA聚合酶', currentLeftX, polymeraseY1 + 10);
                
                // 第2个DNA聚合酶 - 在第3条链边移动
                const gradient2 = this.ctx.createRadialGradient(
                    currentLeftX, polymeraseY2, polymeraseRadius-glowSize,
                    currentLeftX, polymeraseY2, polymeraseRadius+glowSize
                );
                gradient2.addColorStop(0, 'rgba(255, 127, 0, 0.7)');
                gradient2.addColorStop(1, 'rgba(255, 127, 0, 0)');
                this.ctx.beginPath();
                this.ctx.arc(currentLeftX, polymeraseY2, polymeraseRadius+glowSize, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient2;
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(currentLeftX, polymeraseY2, polymeraseRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 127, 0, 0.7)';
                this.ctx.fill();
                
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillStyle = 'black';
                this.ctx.fillText('耐热', currentLeftX, polymeraseY2 - 10);
                this.ctx.fillText('DNA聚合酶', currentLeftX, polymeraseY2 + 10);
                
                // 第3个DNA聚合酶 - 在第2条链边移动
                const gradient3 = this.ctx.createRadialGradient(
                    currentRightX, polymeraseY3, polymeraseRadius-glowSize,
                    currentRightX, polymeraseY3, polymeraseRadius+glowSize
                );
                gradient3.addColorStop(0, 'rgba(255, 127, 0, 0.7)');
                gradient3.addColorStop(1, 'rgba(255, 127, 0, 0)');
                this.ctx.beginPath();
                this.ctx.arc(currentRightX, polymeraseY3, polymeraseRadius+glowSize, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient3;
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(currentRightX, polymeraseY3, polymeraseRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 127, 0, 0.7)';
                this.ctx.fill();
                
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillStyle = 'black';
                this.ctx.fillText('耐热', currentRightX, polymeraseY3 - 10);
                this.ctx.fillText('DNA聚合酶', currentRightX, polymeraseY3 + 10);
                
                // 第4个DNA聚合酶 - 在第4条链边移动
                const gradient4 = this.ctx.createRadialGradient(
                    currentRightX, polymeraseY4, polymeraseRadius-glowSize,
                    currentRightX, polymeraseY4, polymeraseRadius+glowSize
                );
                gradient4.addColorStop(0, 'rgba(255, 127, 0, 0.7)');
                gradient4.addColorStop(1, 'rgba(255, 127, 0, 0)');
                this.ctx.beginPath();
                this.ctx.arc(currentRightX, polymeraseY4, polymeraseRadius+glowSize, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient4;
                this.ctx.fill();
                
                this.ctx.beginPath();
                this.ctx.arc(currentRightX, polymeraseY4, polymeraseRadius, 0, Math.PI * 2);
                this.ctx.fillStyle = 'rgba(255, 127, 0, 0.7)';
                this.ctx.fill();
                
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillStyle = 'black';
                this.ctx.fillText('耐热', currentRightX, polymeraseY4 - 10);
                this.ctx.fillText('DNA聚合酶', currentRightX, polymeraseY4 + 10);
            }
        };
        
        // 添加在特定位置绘制延伸碱基的方法
        dna.drawExtension = function(startPos, length, chainY, templateChainY, isRightDirection = false, isMatchingChain2 = false, isMatchingChain3 = false) {
            // 延伸方向：isRightDirection为true表示向右延伸，false表示向左延伸
            for (let i = 0; i < length; i++) {
                // 计算当前位置
                let position;
                if (isRightDirection) {
                    // 向右延伸（从startPos+1开始）
                    position = startPos + 1 + i;
                } else {
                    // 向左延伸（从startPos-1开始）
                    position = startPos - 1 - i;
                }
                
                // 确保位置有效
                if (position < 0 || position >= this.dnaSequence.length) {
                    continue;
                }
                
                // 获取模板链上的碱基
                const { topBase, bottomBase } = this.dnaSequence[position];
                
                // 获取引物位置信息
                const numBases = this.dnaSequence.length;
                const effectivePrimer1Pos = (primer1Pos !== -1 && !isNaN(primer1Pos)) ? 
                    primer1Pos : Math.floor(numBases / 3);
                const adjustedPrimer1Pos = Math.min(numBases - 1, effectivePrimer1Pos + 3);
                const primer1Length = window.primer1 ? window.primer1.length : 4;
                
                const effectivePrimer2Pos = (primer2Pos !== -1 && !isNaN(primer2Pos)) ? 
                    primer2Pos : Math.floor(numBases * 2 / 3);
                
                // 判断当前位置是否应该显示碱基
                let shouldDrawBase = true;
                
                // 如果是与第2条链匹配的新链，只在第2条链显示碱基的区域绘制延伸碱基
                if (isMatchingChain2 && position >= adjustedPrimer1Pos - primer1Length + 1) {
                    // 在引物1位置显示4个碱基
                    if (position >= adjustedPrimer1Pos - primer1Length + 1 && position <= adjustedPrimer1Pos - primer1Length + 4) {
                        shouldDrawBase = true;
                    } else {
                        shouldDrawBase = false;
                    }
                }
                
                // 如果是与第3条链匹配的新链，只在第3条链显示碱基的区域绘制延伸碱基
                if (isMatchingChain3 && position < effectivePrimer2Pos) {
                    shouldDrawBase = false;
                }
                
                // 如果不应显示碱基，则跳过此位置
                if (!shouldDrawBase) {
                    continue;
                }
                
                // 确定要延伸的碱基 - 与模板链上的碱基互补
                let baseToExtend;
                if (isMatchingChain3) {
                    // 与第3条链互补 - 第3条链上的碱基是topBase
                    baseToExtend = this.basePairs[topBase]; // 与第3条链互补的碱基
                } else if (isMatchingChain2) {
                    // 与第2条链互补 - 第2条链上的碱基是this.basePairs[topBase]
                    baseToExtend = topBase; // 与第2条链互补的碱基
                } else if (isRightDirection) {
                    // 与第4条链互补 - 第4条链上的碱基是this.basePairs[topBase]
                    baseToExtend = topBase; // 与第4条链互补的碱基
                } else {
                    // 与第1条链互补
                    baseToExtend = this.basePairs[topBase];
                }
                
                // 判断是否绘制碱基
                const x = position * this.baseWidth;
                
                // 获取与配对碱基相同的颜色
                const baseColor = this.getBaseColorByIndex(position);
                
                // 绘制延伸的碱基 - 使用与配对碱基相同的颜色
                this.ctx.fillStyle = baseColor;
                this.ctx.fillRect(x, chainY, this.baseWidth, this.baseHeight);
                
                // 添加黑色边框
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, chainY, this.baseWidth, this.baseHeight);
                
                // 绘制碱基字母
                this.ctx.fillStyle = 'white'; // 白色文字，与原始碱基相同
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(baseToExtend, x + this.baseWidth/2, chainY + this.baseHeight/2);
                
                // 添加氢键连接到模板链
                // 确定氢键数量 (A-T有2个，G-C有3个)
                let numBonds;
                if (isRightDirection) {
                    // 与第4或第2条链连接
                    numBonds = (baseToExtend === 'A' || baseToExtend === 'T') ? 2 : 3;
                } else {
                    numBonds = (topBase === 'A' || topBase === 'T') ? 2 : 3;
                }
                
                const bondSpacing = 8; // 氢键之间的间距
                
                // 计算第一个氢键的起始位置
                const startX = x + this.baseWidth/2;
                const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
                
                // 设置氢键样式
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
                this.ctx.setLineDash([2, 2]);
                
                // 绘制氢键
                for (let j = 0; j < numBonds; j++) {
                    const bondX = startX + firstBondOffset + j * bondSpacing;
                    this.ctx.beginPath();
                    if (isRightDirection) {
                        // 引物2延伸的链在上方，氢键向下
                        this.ctx.moveTo(bondX, chainY + this.baseHeight);
                        this.ctx.lineTo(bondX, templateChainY);
                    } else {
                        // 引物1延伸的链在下方，氢键向上
                        this.ctx.moveTo(bondX, templateChainY + this.baseHeight);
                        this.ctx.lineTo(bondX, chainY);
                    }
                    this.ctx.stroke();
                }
                
                // 重置虚线样式
                this.ctx.setLineDash([]);
            }
        };
        
        // 设置DNA序列并保持一致
        setupDNA(dna);
        
        // 设置按钮事件监听器
        setupButtonListeners(dna);
    }
    
    // 设置DNA序列并显示四条链
    function setupDNA(dna) {
        // 如果有存储的DNA序列，使用它
        if (storedDnaSequence) {
            console.log("使用存储的DNA序列");
            dna.dnaSequence = storedDnaSequence;
        } else {
            console.log("生成新的DNA序列");
            dna.generateDNASequence();
        }
        
        // 确保不显示氢键
        dna.denaturationProgress = 1;
        
        // 重绘DNA以显示完整状态
        dna.draw();
        
        console.log("循环2页面已加载，显示四条DNA链");
    }
    
    // 设置按钮事件监听器
    function setupButtonListeners(dna) {
        // 变性按钮点击事件
        const denatureBtn = document.getElementById('denatureBtn');
        if (denatureBtn) {
            denatureBtn.addEventListener('click', () => {
                // 如果已经处于变性状态或正在变性中，不执行动作
                if (dna.isDenaturing || dna.isDenatured) {
                    alert('DNA已处于变性状态或正在变性中');
                    return;
                }
                
                // 标记DNA正在变性中
                dna.isDenaturing = true;
                dna.isDenatured = false;
                
                // 动画持续时间（毫秒）
                const animationDuration = 3000;
                // 记录动画开始时间
                const startTime = Date.now();
                
                // 保存原始的绘制参数
                dna.originalBaseHeight = dna.baseHeight;
                
                // 动画函数
                function animate() {
                    // 计算动画进度 (0-1)
                    const elapsedTime = Date.now() - startTime;
                    const progress = Math.min(elapsedTime / animationDuration, 1);
                    
                    // 更新参数
                    // 碱基高度逐渐减少40%（之前是50%）
                    dna.baseHeight = dna.originalBaseHeight * (1 - progress * 0.4);
                    
                    // 氢键透明度 (逐渐消失)
                    dna.hydrogenBondOpacity = 1 - progress;
                    
                    // 链间距离增大70%（而不是100%）
                    dna.verticalGapMultiplier = 1 + progress * 0.7;
                    
                    // 重绘DNA
                    dna.draw();
                    
                    // 如果动画未完成，继续下一帧
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        // 动画完成
                        dna.isDenaturing = false;
                        dna.isDenatured = true;
                        console.log("变性动画完成");
                    }
                }
                
                // 开始动画
                console.log("开始变性动画");
                requestAnimationFrame(animate);
            });
        }
        
        // 退火按钮点击事件
        const annealBtn = document.getElementById('annealBtn');
        if (annealBtn) {
            annealBtn.addEventListener('click', () => {
                // 只有在变性完成后才能进行退火操作
                if (!dna.isDenatured) {
                    alert('请先完成变性步骤');
                    return;
                }
                
                // 如果已经处于退火状态，不执行操作
                if (dna.isAnnealing || dna.isAnnealed) {
                    alert('引物已经退火到模板链上');
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
                
                // 标记DNA正在退火中
                dna.isAnnealing = true;
                dna.isAnnealed = false;
                dna.annealingProgress = 0;
                
                // 动画持续时间（毫秒）
                const animationDuration = 0; // 0秒
                // 记录动画开始时间
                const startTime = Date.now();
                
                // 动画函数
                function animate() {
                    // 计算动画进度 (0-1)
                    const elapsedTime = Date.now() - startTime;
                    const progress = Math.min(elapsedTime / animationDuration, 1);
                    
                    // 更新退火进度
                    dna.annealingProgress = progress;
                    
                    // 重绘DNA
                    dna.draw();
                    
                    // 如果动画未完成，继续下一帧
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        // 动画完成
                        dna.isAnnealing = false;
                        dna.isAnnealed = true;
                        console.log("退火动画完成");
                    }
                }
                
                // 开始动画
                console.log("开始退火动画");
                requestAnimationFrame(animate);
            });
        }
        
        // 延伸按钮点击事件
        const extendBtn = document.getElementById('extendBtn');
        if (extendBtn) {
            extendBtn.addEventListener('click', () => {
                // 只有在退火完成后才能进行延伸操作
                if (!dna.isAnnealed) {
                    alert('请先完成退火步骤');
                    return;
                }
                
                // 如果已经处于延伸状态，不执行操作
                if (dna.isExtending || dna.isExtended) {
                    alert('DNA已经延伸完成');
                    return;
                }
                
                // 标记DNA正在延伸中
                dna.isExtending = true;
                dna.isExtended = false;
                dna.extensionProgress = 0;
                
                // 计算要延伸的碱基数
                // 获取引物1位置
                const numBases = dna.dnaSequence.length;
                const effectivePrimer1Pos = (primer1Pos !== -1 && !isNaN(primer1Pos)) ? 
                    primer1Pos : Math.floor(numBases / 3);
                const adjustedPrimer1Pos = Math.min(numBases - 1, effectivePrimer1Pos + 3);
                const primer1Length = window.primer1 ? window.primer1.length : 4;
                
                // 计算延伸长度 - 从引物1左侧第一个碱基到DNA链的最左侧
                const extensionLength = adjustedPrimer1Pos - primer1Length + 1;
                
                // 保存延伸相关数据
                dna.primer1Pos = adjustedPrimer1Pos;
                dna.primer1Length = primer1Length;
                dna.extensionLength = extensionLength;
                
                // 动画持续时间（毫秒）
                const animationDuration = 3000; // 3秒
                // 记录动画开始时间
                const startTime = Date.now();
                
                // 动画函数
                function animate() {
                    // 计算动画进度 (0-1)
                    const elapsedTime = Date.now() - startTime;
                    const progress = Math.min(elapsedTime / animationDuration, 1);
                    
                    // 更新延伸进度
                    dna.extensionProgress = progress;
                    
                    // 重绘DNA
                    dna.draw();
                    
                    // 如果动画未完成，继续下一帧
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        // 动画完成
                        dna.isExtending = false;
                        dna.isExtended = true;
                        console.log("延伸动画完成");
                    }
                }
                
                // 开始动画
                console.log("开始延伸动画");
                requestAnimationFrame(animate);
            });
        }
        
        // 下一循环按钮点击事件
        const cycleBtn = document.getElementById('cycleBtn');
        if (cycleBtn) {
            cycleBtn.addEventListener('click', () => {
                // 检查是否已完成延伸
                if (!dna.isExtended) {
                    alert('请先完成变性、退火和延伸步骤');
                    return;
                }
                
                // 序列化DNA序列数据
                const encodedDnaSequence = encodeURIComponent(JSON.stringify(dna.dnaSequence));
                
                // 跳转到循环3页面
                window.location.href = `cycle3.html?primer1=${encodeURIComponent(window.primer1)}&primer2=${encodeURIComponent(window.primer2)}&dnaSequence=${encodedDnaSequence}&primer1Pos=${primer1Pos}&primer2Pos=${primer2Pos}&denatureTemp=${window.denatureTemp}&annealTemp=${window.annealTemp}&extendTemp=${window.extendTemp}`;
            });
        }
        
        // 重置按钮点击事件
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                // 返回循环1页面
                window.location.href = 'index.html';
            });
        }
    }
    
    // 立即初始化页面
    initializePage();
    
    // 添加调试信息
    console.log("cycle2.js 已加载完成");
}); 