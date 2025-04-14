document.addEventListener('DOMContentLoaded', function() {
    console.log("PCR交互系统 - 循环3初始化开始");
    
    // 存储DNA序列
    let storedDnaSequence = null;
    
    // 存储引物位置
    let primer1Pos = -1;
    let primer2Pos = -1;
    
    // 初始化页面
    initializePage();
    
    // 页面初始化函数
    function initializePage() {
        console.log("初始化循环3页面");
        
        // 获取URL参数
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
            }
        });
        
        // 初始化DNA画布
        initializeDNACanvas();
        
        // 设置按钮事件监听器
        setupButtonListeners();
    }
    
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
                }
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
    
    // 初始化DNA画布
    function initializeDNACanvas() {
        const canvas = document.getElementById('dnaCanvas');
        if (!canvas) {
            console.error("找不到DNA画布元素");
            return;
        }
        
        // 创建DNA实例
        const dna = new DNA(canvas);
        
        // 保存DNA实例到canvas对象和全局变量
        canvas.__dna__ = dna;
        window.dnaInstance = dna;
        
        // 添加 drawHydrogenBond 方法，确保其接受4个参数而不是5个
        dna.drawHydrogenBond = function(x, topY, bottomY, base) {
            // 设置氢键样式
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.setLineDash([2, 2]);
            
            // 确定氢键数量 (A-T有2个，G-C有3个)
            const numBonds = (base === 'A' || base === 'T') ? 2 : 3;
            const bondSpacing = 6; // 氢键之间的间距，从8减少到6
            
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
            
            // 重置虚线样式，使用空数组确保是实线
            this.ctx.setLineDash([]);
        };
        
        // 添加绘制引物1的方法
        dna.drawPrimer1 = function() {
            if (!this.isAnnealing || this.primer1Position === -1) return;
            
            const centerY = this.canvas.height / 2;
            const pair1TopY = 40; // 第1对顶部链的Y坐标
            
            // 计算引物1的位置（在第1条链下方0.1cm处）
            const primer1Y = pair1TopY + this.baseHeight + 10; // 10像素约等于0.1cm
            
            // 绘制引物背景
            this.ctx.fillStyle = '#EFC50F';  // 淡黄色半透明背景
            this.ctx.fillRect(
                this.primer1Position * this.baseWidth,
                primer1Y,
                this.baseWidth * window.primer1.length,
                this.baseHeight
            );
            
            // 绘制引物碱基和氢键
            for (let i = 0; i < window.primer1.length; i++) {
                const baseX = this.primer1Position * this.baseWidth + i * this.baseWidth;
                
                // 绘制引物碱基 - 使用淡黄色
                this.ctx.fillStyle = '#F1C40F'; // 更和谐的黄色(金黄色)
                this.ctx.fillRect(baseX, primer1Y, this.baseWidth, this.baseHeight);
                
                // 添加黑色边框
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(baseX, primer1Y, this.baseWidth, this.baseHeight);
                
                // 绘制碱基字母
                this.ctx.fillStyle = 'white'; // 改为白色文字
                this.ctx.font = '18px Arial'; // 减小字体大小
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(window.primer1[i], baseX + this.baseWidth/2, primer1Y + this.baseHeight/2);
                
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
                    this.ctx.moveTo(bondX, pair1TopY + this.baseHeight); // 从DNA链碱基底部开始
                    this.ctx.lineTo(bondX, primer1Y); // 到引物碱基顶部
                    this.ctx.stroke();
                }
                
                // 重置虚线样式
                this.ctx.setLineDash([]);
            }
        };
        
        // 覆盖默认的draw方法，实现显示四对DNA双链
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
            
            // 修改碱基高度（减少60%）
            const originalBaseHeight = this.baseHeight;
            this.baseHeight = Math.floor(this.baseHeight * 0.4);
            
            // 获取引物位置信息
            console.log(`引物1位置: ${primer1Pos}, 碱基总数: ${numBases}`);
            console.log(`引物2位置: ${primer2Pos}, 碱基总数: ${numBases}`);
            
            // 使用有效的引物位置或默认值
            const effectivePrimer1Pos = (primer1Pos !== -1 && !isNaN(primer1Pos)) ? 
                primer1Pos : Math.floor(numBases / 3);
            // 计算引物1的结束位置（考虑引物长度）
            const primer1Length = window.primer1 ? window.primer1.length : 0;
            const primer1EndPos = effectivePrimer1Pos + primer1Length - 1;
            
            const effectivePrimer2Pos = (primer2Pos !== -1 && !isNaN(primer2Pos)) ? 
                primer2Pos : Math.floor(numBases * 2 / 3);
            
            // 计算引物2的开始和结束位置
            const primer2Length = window.primer2 ? window.primer2.length : 0;
            const primer2EndPos = effectivePrimer2Pos + primer2Length - 1;
            
            // 配置链间距与位置 - 减少每对双链之间的距离
            const pairSpacing = 80; // 每对双链之间的距离，从180减少到100
            const chainSpacing = 50;  // 每对双链内部的链间距，
            
            // 计算从上到下4对DNA双链的Y坐标
            const pair1TopY = 40;                      // 第1对顶部链
            const pair1BottomY = pair1TopY + chainSpacing; // 第1对底部链
            
            const pair2TopY = pair1BottomY + pairSpacing;  // 第2对顶部链
            const pair2BottomY = pair2TopY + chainSpacing; // 第2对底部链
            
            const pair3TopY = pair2BottomY + pairSpacing;  // 第3对顶部链
            const pair3BottomY = pair3TopY + chainSpacing; // 第3对底部链
            
            const pair4TopY = pair3BottomY + pairSpacing;  // 第4对顶部链
            const pair4BottomY = pair4TopY + chainSpacing; // 第4对底部链
            
            // 引物1匹配位置的Y坐标 (在第1、3、5、7条链下方0.1cm处)
            const primer1OffsetY = 10; // 0.1cm约等于10像素
            const primer1Chain1Y = pair1TopY + this.baseHeight + primer1OffsetY;  // 第1条链下方
            const primer1Chain3Y = pair2TopY + this.baseHeight + primer1OffsetY;  // 第3条链下方
            const primer1Chain5Y = pair3TopY + this.baseHeight + primer1OffsetY;  // 第5条链下方
            const primer1Chain7Y = pair4TopY + this.baseHeight + primer1OffsetY;  // 第7条链下方
            
            // 引物2匹配位置的Y坐标 (在第2、4、6、8条链上方0.1cm处)
            const primer2OffsetY = 10; // 0.1cm约等于10像素
            const primer2Chain2Y = pair1BottomY - this.baseHeight - primer2OffsetY;  // 第2条链上方
            const primer2Chain4Y = pair2BottomY - this.baseHeight - primer2OffsetY;  // 第4条链上方
            const primer2Chain6Y = pair3BottomY - this.baseHeight - primer2OffsetY;  // 第6条链上方
            const primer2Chain8Y = pair4BottomY - this.baseHeight - primer2OffsetY;  // 第8条链上方
            
            // 修改drawBase方法，确保始终有黑色边框并减小字体大小
            this.drawBase = function(x, y, base, isTopChain) {
                // 完全重写drawBase方法，而不是调用原始方法
                
                // 计算碱基的索引
                const baseIndex = Math.floor(x / this.baseWidth);
                
                // 判断是否在引物1的位置范围内（用于特殊颜色处理）
                const isPrimer1Position = (baseIndex >= effectivePrimer1Pos && baseIndex <= primer1EndPos);
                
                // 判断是否在引物2的位置范围内（用于特殊颜色处理）
                const isPrimer2Position = (baseIndex >= effectivePrimer2Pos && baseIndex <= primer2EndPos);
                
                // 判断当前绘制的是哪一条链
                const isChain2 = (y === pair1BottomY);
                const isChain3 = (y === pair2TopY);
                const isChain4 = (y === pair2BottomY);
                const isChain5 = (y === pair3TopY);
                const isChain6 = (y === pair3BottomY);
                const isChain7 = (y === pair4TopY);
                
                // 判断是否是引物1的位置
                const isPrimer1Chain1 = (y === primer1Chain1Y);
                const isPrimer1Chain3 = (y === primer1Chain3Y);
                const isPrimer1Chain5 = (y === primer1Chain5Y);
                const isPrimer1Chain7 = (y === primer1Chain7Y);
                
                // 判断是否是引物2的位置
                const isPrimer2Chain2 = (y === primer2Chain2Y);
                const isPrimer2Chain4 = (y === primer2Chain4Y);
                const isPrimer2Chain6 = (y === primer2Chain6Y);
                const isPrimer2Chain8 = (y === primer2Chain8Y);
                
                // 设置碱基颜色
                if ((isChain2 || isChain4 || isChain6) && isPrimer1Position) {
                    // 第2、4、6条链上的引物1位置使用引物颜色
                    this.ctx.fillStyle = '#F4AE08'; // 引物
                } else if ((isChain3 || isChain5 || isChain7) && isPrimer2Position) {
                    // 第3、5、7条链上的引物2位置使用引物颜色
                    this.ctx.fillStyle = '#F4AE08'; // 引物
                } else if (isPrimer1Chain1 || isPrimer1Chain3 || isPrimer1Chain5 || isPrimer1Chain7) {
                    // 引物1的碱基使用引物颜色
                    this.ctx.fillStyle = '#F4AE08'; // 引物
                } else if (isPrimer2Chain2 || isPrimer2Chain4 || isPrimer2Chain6 || isPrimer2Chain8) {
                    // 引物2的碱基使用引物颜色
                    this.ctx.fillStyle = '#F4AE08'; //  引物
                } else {
                    // 其他位置使用正常颜色
                    this.ctx.fillStyle = this.getBaseColorByIndex ? 
                        this.getBaseColorByIndex(baseIndex) : '#00c2b4'; // 默认青绿色
                }
                
                // 绘制碱基矩形
                this.ctx.fillRect(x, y, this.baseWidth, this.baseHeight);
                
                // 添加黑色边框
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, this.baseWidth, this.baseHeight);
                
                // 绘制碱基字母 - 使用小尺寸字体
                this.ctx.fillStyle = 'white';
                this.ctx.font = '14px Arial'; // 直接设置小字体
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(base, x + this.baseWidth/2, y + this.baseHeight/2);
            };
            
            // 添加getBaseColorByIndex方法的实现
            if (!this.getBaseColorByIndex) {
                this.getBaseColorByIndex = function(index) {
                    const numBases = this.dnaSequence.length;
                    const startPoint = Math.floor((numBases - 22) / 2);
                    const endPoint = startPoint + 22;
                    
                    if (index >= startPoint && index < endPoint) {
                        return '#ff515c'; // 更美观的红色(鲜红色)
                    } else {
                        return '#00c2b4'; // 更美观的绿色(青绿色)
                    }
                };
            }
            
            // 为引物1绘制氢键的方法
            this.drawPrimer1HydrogenBonds = function(topY, primerY, startPos, primerLength) {
                for (let i = 0; i < primerLength; i++) {
                    const x = (startPos + i) * this.baseWidth;
                    const topBase = this.dnaSequence[startPos + i].topBase;
                    const bottomBase = this.basePairs[topBase]; // 引物碱基是模板链的互补碱基
                    
                    // 绘制氢键
                    this.drawHydrogenBond(x, topY, primerY, topBase);
                }
            };
            
            // 为引物2绘制氢键的方法
            this.drawPrimer2HydrogenBonds = function(bottomY, primerY, startPos, primerLength) {
                for (let i = 0; i < primerLength; i++) {
                    const x = (startPos + i) * this.baseWidth;
                    const bottomBase = this.basePairs[this.dnaSequence[startPos + i].topBase]; // 获取下链碱基
                    
                    // 绘制氢键
                    this.drawHydrogenBond(x, primerY, bottomY, bottomBase);
                }
            };
            
            // 绘制第1对DNA双链
            for (let i = 0; i < numBases; i++) {
                const x = i * this.baseWidth;
                const { topBase, bottomBase } = this.dnaSequence[i];
                
                // 第1条链 - 完整显示
                this.drawBase(x, pair1TopY, topBase, true);
                
                // 第2条链 - 在引物1位置右侧不显示碱基
                if (i <= primer1EndPos || effectivePrimer1Pos === -1) {
                    this.drawBase(x, pair1BottomY, this.basePairs[topBase], false);
                    // 绘制氢键
                    this.drawHydrogenBond(x, pair1TopY, pair1BottomY, topBase);
                }
            }
            
            // 绘制第2对DNA双链
            for (let i = 0; i < numBases; i++) {
                const x = i * this.baseWidth;
                const { topBase, bottomBase } = this.dnaSequence[i];
                
                // 第3条链 - 在引物2位置左侧和引物1位置右侧不显示碱基
                if (i >= effectivePrimer2Pos && i <= primer1EndPos) {
                    this.drawBase(x, pair2TopY, topBase, true);
                }
                
                // 第4条链 - 在引物1位置右侧不显示碱基
                if (i <= primer1EndPos) {
                    this.drawBase(x, pair2BottomY, this.basePairs[topBase], false);
                }
                
                // 绘制氢键
                if (i >= effectivePrimer2Pos && i <= primer1EndPos) {
                    this.drawHydrogenBond(x, pair2TopY, pair2BottomY, topBase);
                }
            }
            
            // 绘制第3对DNA双链
            for (let i = 0; i < numBases; i++) {
                const x = i * this.baseWidth;
                const { topBase, bottomBase } = this.dnaSequence[i];
                
                // 第5条链 - 在引物2位置左侧不显示碱基
                if (i >= effectivePrimer2Pos || effectivePrimer2Pos === -1) {
                    this.drawBase(x, pair3TopY, topBase, true);
                }
                
                // 第6条链 - 在引物2位置左侧和引物1位置右侧不显示碱基
                if ((i >= effectivePrimer2Pos && i <= primer1EndPos) || effectivePrimer2Pos === -1) {
                    this.drawBase(x, pair3BottomY, this.basePairs[topBase], false);
                    // 绘制氢键
                    this.drawHydrogenBond(x, pair3TopY, pair3BottomY, topBase);
                }
            }
            
            // 绘制第4对DNA双链
            for (let i = 0; i < numBases; i++) {
                const x = i * this.baseWidth;
                const { topBase, bottomBase } = this.dnaSequence[i];
                
                // 第7条链 - 在引物2位置左侧不显示碱基
                if (i >= effectivePrimer2Pos || effectivePrimer2Pos === -1) {
                    this.drawBase(x, pair4TopY, topBase, true);
                }
                
                // 第8条链 - 正常显示
                this.drawBase(x, pair4BottomY, this.basePairs[topBase], false);
                
                // 绘制氢键
                if (i >= effectivePrimer2Pos || effectivePrimer2Pos === -1) {
                    this.drawHydrogenBond(x, pair4TopY, pair4BottomY, topBase);
                }
            }
            
            // 绘制每对链的5'和3'标签
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillStyle = 'black';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 第1对双链标签
            // 上链标签
            this.ctx.fillText("5'", this.baseWidth/2, pair1TopY - 15);
            this.ctx.fillText("3'", (numBases - 0.5) * this.baseWidth, pair1TopY - 15);
            // 下链标签 - 将5'标志移动到引物1位置右侧
            this.ctx.fillText("3'", this.baseWidth/2, pair1BottomY + this.baseHeight + 15);
            this.ctx.fillText("5'", (primer1EndPos + 0.5) * this.baseWidth, pair1BottomY + this.baseHeight + 15);
            
            // 第2对双链标签
            // 上链标签 - 将5'标志移动到引物2位置左侧，3'标志移动到引物1位置右侧
            this.ctx.fillText("5'", (effectivePrimer2Pos - 0.5) * this.baseWidth, pair2TopY + this.baseHeight - 5);
            this.ctx.fillText("3'", (primer1EndPos + 0.5) * this.baseWidth, pair2TopY - 15);
            // 下链标签 - 将5'标志移动到引物1位置右侧
            this.ctx.fillText("3'", this.baseWidth/2, pair2BottomY + this.baseHeight + 15);
            this.ctx.fillText("5'", (primer1EndPos + 0.5) * this.baseWidth, pair2BottomY + this.baseHeight + 15);
            
            // 第3对双链标签
            // 上链标签 - 将5'标志移动到引物2位置左侧
            this.ctx.fillText("5'", (effectivePrimer2Pos - 0.5) * this.baseWidth, pair3TopY + this.baseHeight - 5);
            this.ctx.fillText("3'", (numBases - 0.5) * this.baseWidth, pair3TopY - 15);
            // 下链标签 - 将3'标志移动到引物2位置左侧，5'标志移动到引物1位置右侧
            this.ctx.fillText("3'", (effectivePrimer2Pos - 0.5) * this.baseWidth, pair3BottomY + this.baseHeight - 5);
            this.ctx.fillText("5'", (primer1EndPos + 0.5) * this.baseWidth, pair3BottomY + this.baseHeight + 15);
            
            // 第4对双链标签
            // 上链标签 - 将5'标志移动到引物2位置左侧
            this.ctx.fillText("5'", (effectivePrimer2Pos - 0.5) * this.baseWidth, pair4TopY + this.baseHeight - 5);
            this.ctx.fillText("3'", (numBases - 0.5) * this.baseWidth, pair4TopY - 15);
            // 下链标签
            this.ctx.fillText("3'", this.baseWidth/2, pair4BottomY + this.baseHeight + 15);
            this.ctx.fillText("5'", (numBases - 0.5) * this.baseWidth, pair4BottomY + this.baseHeight + 15);
            
            // 恢复原始的drawBase方法和碱基高度
            this.drawBase = originalDrawBase;
            this.baseHeight = originalBaseHeight;
            
            console.log("绘制四对DNA双链完成");
            
            // 如果正在退火，绘制引物1
            if (this.isAnnealing) {
                this.drawPrimer1();
            }
        };
        
        // 设置DNA序列并显示四对双链
        setupDNA(dna);
    }
    
    // 设置DNA序列并显示
    function setupDNA(dna) {
        // 如果有存储的DNA序列，使用它
        if (storedDnaSequence) {
            console.log("使用存储的DNA序列");
            dna.dnaSequence = storedDnaSequence;
        } else {
            console.log("生成新的DNA序列");
            dna.generateDNASequence();
        }
        
        // 重绘DNA以显示完整状态
        dna.draw();
        
        console.log("循环3页面已加载，显示四对DNA双链");
    }
    
    // 设置按钮事件监听器
    function setupButtonListeners() {
        // 变性按钮点击事件
        const denatureBtn = document.getElementById('denatureBtn');
        if (denatureBtn) {
            denatureBtn.addEventListener('click', () => {
                console.log("变性按钮点击");
                
                // 从全局变量获取DNA实例
                const dnaInstance = window.dnaInstance;
                if (!dnaInstance) {
                    console.error("无法获取DNA实例");
                    alert("无法启动变性过程，请刷新页面重试");
                    return;
                }
                
                // 启动变性动画
                startDenaturation(dnaInstance);
            });
        }
        
        // 退火按钮点击事件
        const annealBtn = document.getElementById('annealBtn');
        if (annealBtn) {
            annealBtn.addEventListener('click', () => {
                console.log("退火按钮点击");
                
                // 从全局变量获取DNA实例
                const dnaInstance = window.dnaInstance;
                if (!dnaInstance) {
                    console.error("无法获取DNA实例");
                    alert("无法启动退火过程，请刷新页面重试");
                    return;
                }
                
                // 检查是否已完成变性
                if (!dnaInstance.isDenatured) {
                    alert("请先完成变性步骤");
                    return;
                }
                
                // 设置退火状态
                dnaInstance.isAnnealing = true;
                
                // 设置引物1位置
                const numBases = dnaInstance.dnaSequence.length;
                dnaInstance.primer1Position = (primer1Pos !== -1 && !isNaN(primer1Pos)) ? 
                    primer1Pos : Math.floor(numBases / 3);
                
                // 使用变性后的间距和状态重绘DNA
                dnaInstance.drawWithDenaturation(1); // 使用进度1表示完全变性状态
                
                // 启用延伸按钮
                const extendBtn = document.getElementById('extendBtn');
                if (extendBtn) {
                    extendBtn.disabled = false;
                }
                
                console.log("退火完成，引物1已添加到第1条链下方，保持变性后的间距");
            });
        }
        
        // 延伸按钮点击事件
        const extendBtn = document.getElementById('extendBtn');
        if (extendBtn) {
            extendBtn.addEventListener('click', () => {
                console.log("延伸按钮点击");
                
                // 从全局变量获取DNA实例
                const dnaInstance = window.dnaInstance;
                if (!dnaInstance) {
                    console.error("无法获取DNA实例");
                    alert("无法启动延伸过程，请刷新页面重试");
                    return;
                }
                
                // 检查是否已完成退火
                if (!dnaInstance.isAnnealing) {
                    alert("请先完成退火步骤");
                    return;
                }
                
                // 设置延伸状态
                dnaInstance.isExtending = true;
                dnaInstance.extensionProgress = 0;
                
                // 开始延伸动画
                const startTime = Date.now();
                const animationDuration = 3000; // 3秒
                
                function animateExtension() {
                    const currentTime = Date.now();
                    const elapsed = currentTime - startTime;
                    dnaInstance.extensionProgress = Math.min(elapsed / animationDuration, 1);
                    
                    // 使用变性后的间距和状态重绘DNA，并显示延伸过程
                    dnaInstance.drawWithDenaturation(1);
                    
                    if (dnaInstance.extensionProgress < 1) {
                        requestAnimationFrame(animateExtension);
                    } else {
                        // 延伸完成
                        dnaInstance.isExtending = false;
                        console.log("延伸完成");
                    }
                }
                
                // 开始动画
                animateExtension();
            });
        }
        
        // 重置按钮点击事件
        const resetBtn = document.getElementById('resetBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                console.log("重置按钮点击");
                window.location.href = 'index.html';
            });
        }
        
        console.log("按钮事件监听器设置完成");
    }
    
    // 启动变性动画
    function startDenaturation(dna) {
        console.log("启动变性动画", dna);
        if (!dna) {
            console.error("DNA对象为空，无法执行变性动画");
            return;
        }

        // 创建一个新的DNA绘制函数，包含变性动画
        dna.drawWithDenaturation = function(progress) {
            // 清空画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // 如果没有DNA序列，生成一个
            if (!this.dnaSequence || this.dnaSequence.length === 0) {
                this.generateDNASequence();
            }
            
            const numBases = this.dnaSequence.length;
            
            // 保存原始绘制方法以便恢复
            const originalDrawBase = this.drawBase;
            
            // 修改碱基高度（减少60%）
            const originalBaseHeight = this.baseHeight;
            this.baseHeight = Math.floor(this.baseHeight * 0.4);
            
            // 获取引物位置信息
            const effectivePrimer1Pos = (primer1Pos !== -1 && !isNaN(primer1Pos)) ? 
                primer1Pos : Math.floor(numBases / 3);
            const primer1Length = window.primer1 ? window.primer1.length : 0;
            const primer1EndPos = effectivePrimer1Pos + primer1Length - 1;
            
            const effectivePrimer2Pos = (primer2Pos !== -1 && !isNaN(primer2Pos)) ? 
                primer2Pos : Math.floor(numBases * 2 / 3);
            const primer2Length = window.primer2 ? window.primer2.length : 0;
            const primer2EndPos = effectivePrimer2Pos + primer2Length - 1;
            
            // 基础链间距和双链间距
            const baseChainSpacing = 50;
            const basePairSpacing = 80;
            
            // 随着变性进度动态计算链间距 - 链间距增加，双链间距减少
            const chainSpacingIncrease = 0.65; // 链间距增加最大幅度
            const pairSpacingDecrease = 0.4;  // 双链间距减少最大幅度
            
            // 根据进度计算当前值
            const currentChainSpacing = baseChainSpacing * (1 + chainSpacingIncrease * progress);
            const currentPairSpacing = basePairSpacing * (1 - pairSpacingDecrease * progress);
            
            // 计算从上到下4对DNA双链的Y坐标
            const pair1TopY = 40;                         // 第1对顶部链
            const pair1BottomY = pair1TopY + currentChainSpacing; // 第1对底部链
            
            const pair2TopY = pair1BottomY + currentPairSpacing;  // 第2对顶部链
            const pair2BottomY = pair2TopY + currentChainSpacing; // 第2对底部链
            
            const pair3TopY = pair2BottomY + currentPairSpacing;  // 第3对顶部链
            const pair3BottomY = pair3TopY + currentChainSpacing; // 第3对底部链
            
            const pair4TopY = pair3BottomY + currentPairSpacing;  // 第4对顶部链
            const pair4BottomY = pair4TopY + currentChainSpacing; // 第4对底部链
            
            // 如果正在延伸，绘制延伸过程
            if (this.isExtending) {
                console.log("正在绘制延伸过程，进度:", this.extensionProgress);
                
                // 计算第1条链延伸的起始位置（引物1的左端）
                const extensionStartX1 = effectivePrimer1Pos * this.baseWidth;
                // 计算第1条链延伸的结束位置（第1条链的最左端，包含第一个碱基）
                const extensionEndX1 = -this.baseWidth; // 确保包含第一个碱基
                
                // 计算第1条链新链的Y坐标（在第1条链下方0.1cm处）
                const newChainY1 = pair1TopY + this.baseHeight + 10; // 10像素约等于0.1cm
                
                // 计算第1条链需要延伸的碱基数量
                const extensionLength1 = effectivePrimer1Pos + 1; // 加1确保包含第一个碱基
                
                // 计算第2条链延伸的起始位置（引物2的右端）
                const extensionStartX2 = (effectivePrimer2Pos + window.primer2.length - 1) * this.baseWidth;
                // 计算第2条链延伸的结束位置（引物1位置）
                const extensionEndX2 = primer1EndPos * this.baseWidth;
                
                // 计算第2条链新链的Y坐标（在第2条链上方0.1cm处）
                const newChainY2 = pair1BottomY - this.baseHeight - 10; // 10像素约等于0.1cm
                
                // 计算第2条链需要延伸的碱基数量
                const extensionLength2 = primer1EndPos - (effectivePrimer2Pos + window.primer2.length - 1);
                
                // 计算第8条链延伸的起始位置（引物2的右端）
                const extensionStartX3 = (effectivePrimer2Pos + window.primer2.length - 1) * this.baseWidth;
                // 计算第8条链延伸的结束位置（第8条链的最右端）
                const extensionEndX3 = (numBases - 1) * this.baseWidth;
                
                // 计算第8条链新链的Y坐标（在第8条链上方0.1cm处）
                const newChainY3 = pair4BottomY - this.baseHeight - 10; // 10像素约等于0.1cm
                
                // 计算第8条链需要延伸的碱基数量
                const extensionLength3 = numBases - (effectivePrimer2Pos + window.primer2.length);
                
                // 计算第3条链延伸的起始位置（引物1的左端）
                const extensionStartX4 = effectivePrimer1Pos * this.baseWidth;
                // 计算第3条链延伸的结束位置（引物2位置）
                const extensionEndX4 = effectivePrimer2Pos * this.baseWidth;
                
                // 计算第3条链新链的Y坐标（在第3条链下方0.1cm处）
                const newChainY4 = pair2TopY + this.baseHeight + 10; // 10像素约等于0.1cm
                
                // 计算第3条链需要延伸的碱基数量
                const extensionLength4 = effectivePrimer1Pos - effectivePrimer2Pos + 1; // 加1确保包含引物2位置
                
                // 计算第4条链延伸的起始位置（引物2的右端）
                const extensionStartX5 = (effectivePrimer2Pos + window.primer2.length - 1) * this.baseWidth;
                // 计算第4条链延伸的结束位置（引物1位置）
                const extensionEndX5 = primer1EndPos * this.baseWidth;
                
                // 计算第4条链新链的Y坐标（在第4条链上方0.1cm处）
                const newChainY5 = pair2BottomY - this.baseHeight - 10; // 10像素约等于0.1cm
                
                // 计算第4条链需要延伸的碱基数量
                const extensionLength5 = primer1EndPos - (effectivePrimer2Pos + window.primer2.length - 1);
                
                // 计算第6条链延伸的起始位置（引物2的右端）
                const extensionStartX6 = (effectivePrimer2Pos + window.primer2.length - 1) * this.baseWidth;
                // 计算第6条链延伸的结束位置（引物1位置）
                const extensionEndX6 = primer1EndPos * this.baseWidth;
                
                // 计算第6条链新链的Y坐标（在第6条链上方0.1cm处）
                const newChainY6 = pair3BottomY - this.baseHeight - 10; // 10像素约等于0.1cm
                
                // 计算第6条链需要延伸的碱基数量
                const extensionLength6 = primer1EndPos - (effectivePrimer2Pos + window.primer2.length - 1);
                
                // 计算第7条链延伸的起始位置（引物1的左端）
                const extensionStartX7 = effectivePrimer1Pos * this.baseWidth;
                // 计算第7条链延伸的结束位置（引物2位置）
                const extensionEndX7 = effectivePrimer2Pos * this.baseWidth;
                
                // 计算第7条链新链的Y坐标（在第7条链下方0.1cm处）
                const newChainY7 = pair4TopY + this.baseHeight + 10; // 10像素约等于0.1cm
                
                // 计算第7条链需要延伸的碱基数量（从引物1位置到引物2位置）
                const extensionLength7 = effectivePrimer1Pos - effectivePrimer2Pos + 1; // 加1确保包含引物2位置
                
                // 计算当前应该显示的碱基数量
                const currentBasesToShow1 = Math.floor(extensionLength1 * this.extensionProgress);
                const currentBasesToShow2 = Math.floor(extensionLength2 * this.extensionProgress);
                const currentBasesToShow3 = Math.floor(extensionLength3 * this.extensionProgress);
                const currentBasesToShow4 = Math.floor(extensionLength4 * this.extensionProgress);
                const currentBasesToShow5 = Math.floor(extensionLength5 * this.extensionProgress);
                const currentBasesToShow6 = Math.floor(extensionLength6 * this.extensionProgress);
                const currentBasesToShow7 = Math.floor(extensionLength7 * this.extensionProgress);
                
                // 绘制第1条链的延伸
                for (let i = 0; i < currentBasesToShow1; i++) {
                    // 计算当前碱基的X坐标，从右向左延伸
                    const baseX = extensionStartX1 - (i * this.baseWidth);
                    
                    // 获取对应的模板链碱基
                    const templateBase = this.dnaSequence[effectivePrimer1Pos - i].topBase;
                    // 获取互补碱基
                    const complementaryBase = this.basePairs[templateBase];
                    
                    // 获取模板链碱基的颜色
                    const templateBaseIndex = effectivePrimer1Pos - i;
                    const baseColor = this.getBaseColorByIndex ? 
                        this.getBaseColorByIndex(templateBaseIndex) : '#00c2b4';
                    
                    // 绘制碱基
                    this.ctx.fillStyle = baseColor;
                    this.ctx.fillRect(baseX, newChainY1, this.baseWidth, this.baseHeight);
                    
                    // 添加黑色边框
                    this.ctx.strokeStyle = 'black';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(baseX, newChainY1, this.baseWidth, this.baseHeight);
                    
                    // 绘制碱基字母
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(complementaryBase, baseX + this.baseWidth/2, newChainY1 + this.baseHeight/2);
                    
                    // 绘制氢键
                    this.ctx.strokeStyle = 'black';
                    this.ctx.setLineDash([2, 2]);
                    
                    // 确定氢键数量 (A-T有2个，G-C有3个)
                    const numBonds = (templateBase === 'A' || templateBase === 'T') ? 2 : 3;
                    const bondSpacing = 6;
                    
                    // 计算第一个氢键的起始位置
                    const startX = baseX + this.baseWidth/2;
                    const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
                    
                    // 绘制氢键 - 连接到第1条链
                    for (let j = 0; j < numBonds; j++) {
                        const bondX = startX + firstBondOffset + j * bondSpacing;
                        this.ctx.beginPath();
                        this.ctx.moveTo(bondX, pair1TopY + this.baseHeight);
                        this.ctx.lineTo(bondX, newChainY1);
                        this.ctx.stroke();
                    }
                    
                    // 重置虚线样式
                    this.ctx.setLineDash([]);
                }
                
                // 绘制DNA聚合酶 - 在引物1位置处的橙色圆形
                if (this.isExtending && false) { // 添加false条件，使此代码块不执行
                    // 计算当前位置 - 随着延伸进度向左移动
                    const polymeraseX = extensionStartX1 - (currentBasesToShow1 * this.baseWidth) + this.baseWidth/2;
                    const polymeraseY = newChainY1; // 在新链上方一点位置
                    
                    // 绘制橙色圆形代表DNA聚合酶
                    this.ctx.beginPath();
                    this.ctx.arc(polymeraseX, polymeraseY, 24, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#FF8C00'; // 橙色
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#FF4500'; // 深橙色边框
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    
                    // 可选：添加字母"P"表示聚合酶
                    this.ctx.fillStyle = 'black';
                    this.ctx.font = 'bold 8px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText("DNA 聚合酶", polymeraseX, polymeraseY);
                    
                    console.log("绘制DNA聚合酶，位置:", polymeraseX, polymeraseY);
                }
                
                // 绘制第2条链的延伸
                for (let i = 0; i < currentBasesToShow2; i++) {
                    // 计算当前碱基的X坐标，从左向右延伸
                    const baseX = extensionStartX2 + (i + 1) * this.baseWidth;
                    
                    // 获取对应的模板链碱基 - 使用第2条链自身作为模板
                    const templateIndex = effectivePrimer2Pos + window.primer2.length + i;
                    // 注意：第2条链是下链，应该使用bottomBase
                    const templateBase = this.basePairs[this.dnaSequence[templateIndex].topBase];
                    // 获取互补碱基 - 新链的碱基应该与模板链互补
                    const complementaryBase = this.basePairs[templateBase];
                    
                    // 获取模板链碱基的颜色
                    const templateBaseIndex = templateIndex;
                    const baseColor = this.getBaseColorByIndex ? 
                        this.getBaseColorByIndex(templateBaseIndex) : '#00c2b4';
                    
                    // 绘制碱基
                    this.ctx.fillStyle = baseColor;
                    this.ctx.fillRect(baseX, newChainY2, this.baseWidth, this.baseHeight);
                    
                    // 添加黑色边框
                    this.ctx.strokeStyle = 'black';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(baseX, newChainY2, this.baseWidth, this.baseHeight);
                    
                    // 绘制碱基字母 - 显示互补碱基
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(complementaryBase, baseX + this.baseWidth/2, newChainY2 + this.baseHeight/2);
                    
                    // 绘制氢键
                    this.ctx.strokeStyle = 'black';
                    this.ctx.setLineDash([2, 2]);
                    
                    // 确定氢键数量 (A-T有2个，G-C有3个)
                    const numBonds = (templateBase === 'A' || templateBase === 'T') ? 2 : 3;
                    const bondSpacing = 6;
                    
                    // 计算第一个氢键的起始位置
                    const startX = baseX + this.baseWidth/2;
                    const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
                    
                    // 绘制氢键
                    for (let j = 0; j < numBonds; j++) {
                        const bondX = startX + firstBondOffset + j * bondSpacing;
                        this.ctx.beginPath();
                        this.ctx.moveTo(bondX, pair1BottomY);
                        this.ctx.lineTo(bondX, newChainY2 + this.baseHeight);
                        this.ctx.stroke();
                    }
                    
                    // 重置虚线样式
                    this.ctx.setLineDash([]);
                }
                
                // 绘制第8条链的延伸
                for (let i = 0; i < currentBasesToShow3; i++) {
                    // 计算当前碱基的X坐标，从左向右延伸
                    const baseX = extensionStartX3 + (i + 1) * this.baseWidth;
                    
                    // 获取对应的模板链碱基 - 使用第8条链自身作为模板
                    const templateIndex = effectivePrimer2Pos + window.primer2.length + i;
                    // 注意：第8条链是下链，应该使用bottomBase
                    const templateBase = this.basePairs[this.dnaSequence[templateIndex].topBase];
                    // 获取互补碱基 - 新链的碱基应该与模板链互补
                    const complementaryBase = this.basePairs[templateBase];
                    
                    // 获取模板链碱基的颜色
                    const templateBaseIndex = templateIndex;
                    const baseColor = this.getBaseColorByIndex ? 
                        this.getBaseColorByIndex(templateBaseIndex) : '#00c2b4';
                    
                    // 绘制碱基
                    this.ctx.fillStyle = baseColor;
                    this.ctx.fillRect(baseX, newChainY3, this.baseWidth, this.baseHeight);
                    
                    // 添加黑色边框
                    this.ctx.strokeStyle = 'black';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(baseX, newChainY3, this.baseWidth, this.baseHeight);
                    
                    // 绘制碱基字母 - 显示互补碱基
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(complementaryBase, baseX + this.baseWidth/2, newChainY3 + this.baseHeight/2);
                    
                    // 绘制氢键
                    this.ctx.strokeStyle = 'black';
                    this.ctx.setLineDash([2, 2]);
                    
                    // 确定氢键数量 (A-T有2个，G-C有3个)
                    const numBonds = (templateBase === 'A' || templateBase === 'T') ? 2 : 3;
                    const bondSpacing = 6;
                    
                    // 计算第一个氢键的起始位置
                    const startX = baseX + this.baseWidth/2;
                    const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
                    
                    // 绘制氢键
                    for (let j = 0; j < numBonds; j++) {
                        const bondX = startX + firstBondOffset + j * bondSpacing;
                        this.ctx.beginPath();
                        this.ctx.moveTo(bondX, pair4BottomY);
                        this.ctx.lineTo(bondX, newChainY3 + this.baseHeight);
                        this.ctx.stroke();
                    }
                    
                    // 重置虚线样式
                    this.ctx.setLineDash([]);
                }
                
                // 绘制第3条链的延伸
                for (let i = 0; i < currentBasesToShow4; i++) {
                    // 计算当前碱基的X坐标，从右向左延伸
                    const baseX = extensionStartX4 - (i * this.baseWidth);
                    
                    // 获取对应的模板链碱基
                    const templateBase = this.dnaSequence[effectivePrimer1Pos - i].topBase;
                    // 获取互补碱基
                    const complementaryBase = this.basePairs[templateBase];
                    
                    // 获取模板链碱基的颜色
                    const templateBaseIndex = effectivePrimer1Pos - i;
                    const baseColor = this.getBaseColorByIndex ? 
                        this.getBaseColorByIndex(templateBaseIndex) : '#00c2b4';
                    
                    // 绘制碱基
                    this.ctx.fillStyle = baseColor;
                    this.ctx.fillRect(baseX, newChainY4, this.baseWidth, this.baseHeight);
                    
                    // 添加黑色边框
                    this.ctx.strokeStyle = 'black';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(baseX, newChainY4, this.baseWidth, this.baseHeight);
                    
                    // 绘制碱基字母
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(complementaryBase, baseX + this.baseWidth/2, newChainY4 + this.baseHeight/2);
                    
                    // 绘制氢键
                    this.ctx.strokeStyle = 'black';
                    this.ctx.setLineDash([2, 2]);
                    
                    // 确定氢键数量 (A-T有2个，G-C有3个)
                    const numBonds = (templateBase === 'A' || templateBase === 'T') ? 2 : 3;
                    const bondSpacing = 6;
                    
                    // 计算第一个氢键的起始位置
                    const startX = baseX + this.baseWidth/2;
                    const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
                    
                    // 绘制氢键 - 连接到第3条链
                    for (let j = 0; j < numBonds; j++) {
                        const bondX = startX + firstBondOffset + j * bondSpacing;
                        this.ctx.beginPath();
                        this.ctx.moveTo(bondX, pair2TopY + this.baseHeight);
                        this.ctx.lineTo(bondX, newChainY4);
                        this.ctx.stroke();
                    }
                    
                    // 重置虚线样式
                    this.ctx.setLineDash([]);
                }
                
                // 计算第5条链延伸的起始位置（引物1的左端）
                const chain5ExtensionStartX = effectivePrimer1Pos * this.baseWidth;
                // 计算第5条链延伸的结束位置（引物2位置）
                const chain5ExtensionEndX = effectivePrimer2Pos * this.baseWidth;
                
                // 计算第5条链新链的Y坐标（在第5条链下方0.1cm处）
                const chain5NewY = pair3TopY + this.baseHeight + 10; // 10像素约等于0.1cm
                
                // 计算第5条链需要延伸的碱基数量（从引物1位置到引物2位置）
                const chain5ExtensionLength = effectivePrimer1Pos - effectivePrimer2Pos + 1; // 加1确保包含引物2位置
                
                // 计算当前应该显示的碱基数量
                const chain5CurrentBasesToShow = Math.floor(chain5ExtensionLength * this.extensionProgress);
                
                // 绘制第5条链的延伸
                for (let i = 0; i < chain5CurrentBasesToShow; i++) {
                    // 计算当前碱基的X坐标，从右向左延伸
                    const baseX = chain5ExtensionStartX - (i * this.baseWidth);
                    
                    // 获取对应的模板链碱基
                    const templateBase = this.dnaSequence[effectivePrimer1Pos - i].topBase;
                    // 获取互补碱基
                    const complementaryBase = this.basePairs[templateBase];
                    
                    // 获取模板链碱基的颜色
                    const templateBaseIndex = effectivePrimer1Pos - i;
                    const baseColor = this.getBaseColorByIndex ? 
                        this.getBaseColorByIndex(templateBaseIndex) : '#00c2b4';
                    
                    // 绘制碱基
                    this.ctx.fillStyle = baseColor;
                    this.ctx.fillRect(baseX, chain5NewY, this.baseWidth, this.baseHeight);
                    
                    // 添加黑色边框
                    this.ctx.strokeStyle = 'black';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(baseX, chain5NewY, this.baseWidth, this.baseHeight);
                    
                    // 绘制碱基字母
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(complementaryBase, baseX + this.baseWidth/2, chain5NewY + this.baseHeight/2);
                    
                    // 绘制氢键
                    this.ctx.strokeStyle = 'black';
                    this.ctx.setLineDash([2, 2]);
                    
                    // 确定氢键数量 (A-T有2个，G-C有3个)
                    const numBonds = (templateBase === 'A' || templateBase === 'T') ? 2 : 3;
                    const bondSpacing = 6;
                    
                    // 计算第一个氢键的起始位置
                    const startX = baseX + this.baseWidth/2;
                    const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
                    
                    // 绘制氢键 - 连接到第5条链
                    for (let j = 0; j < numBonds; j++) {
                        const bondX = startX + firstBondOffset + j * bondSpacing;
                        this.ctx.beginPath();
                        this.ctx.moveTo(bondX, pair3TopY + this.baseHeight);
                        this.ctx.lineTo(bondX, chain5NewY);
                        this.ctx.stroke();
                    }
                    
                    // 重置虚线样式
                    this.ctx.setLineDash([]);
                }
                
                // 绘制第6条链的延伸
                for (let i = 0; i < currentBasesToShow6; i++) {
                    // 计算当前碱基的X坐标，从左向右延伸
                    const baseX = extensionStartX6 + (i + 1) * this.baseWidth;
                    
                    // 获取对应的模板链碱基 - 使用第6条链自身作为模板
                    const templateIndex = effectivePrimer2Pos + window.primer2.length + i;
                    // 注意：第6条链是下链，应该使用bottomBase
                    const templateBase = this.basePairs[this.dnaSequence[templateIndex].topBase];
                    // 获取互补碱基 - 新链的碱基应该与模板链互补
                    const complementaryBase = this.basePairs[templateBase];
                    
                    // 获取模板链碱基的颜色
                    const templateBaseIndex = templateIndex;
                    const baseColor = this.getBaseColorByIndex ? 
                        this.getBaseColorByIndex(templateBaseIndex) : '#00c2b4';
                    
                    // 绘制碱基
                    this.ctx.fillStyle = baseColor;
                    this.ctx.fillRect(baseX, newChainY6, this.baseWidth, this.baseHeight);
                    
                    // 添加黑色边框
                    this.ctx.strokeStyle = 'black';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(baseX, newChainY6, this.baseWidth, this.baseHeight);
                    
                    // 绘制碱基字母 - 显示互补碱基
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(complementaryBase, baseX + this.baseWidth/2, newChainY6 + this.baseHeight/2);
                    
                    // 绘制氢键
                    this.ctx.strokeStyle = 'black';
                    this.ctx.setLineDash([2, 2]);
                    
                    // 确定氢键数量 (A-T有2个，G-C有3个)
                    const numBonds = (templateBase === 'A' || templateBase === 'T') ? 2 : 3;
                    const bondSpacing = 6;
                    
                    // 计算第一个氢键的起始位置
                    const startX = baseX + this.baseWidth/2;
                    const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
                    
                    // 绘制氢键 - 连接到第6条链
                    for (let j = 0; j < numBonds; j++) {
                        const bondX = startX + firstBondOffset + j * bondSpacing;
                        this.ctx.beginPath();
                        this.ctx.moveTo(bondX, pair3BottomY);
                        this.ctx.lineTo(bondX, newChainY6 + this.baseHeight);
                        this.ctx.stroke();
                    }
                    
                    // 重置虚线样式
                    this.ctx.setLineDash([]);
                }
                
                // 绘制第7条链的延伸
                for (let i = 0; i < currentBasesToShow7; i++) {
                    // 计算当前碱基的X坐标，从右向左延伸
                    const baseX = extensionStartX7 - (i * this.baseWidth);
                    
                    // 获取对应的模板链碱基
                    const templateBase = this.dnaSequence[effectivePrimer1Pos - i].topBase;
                    // 获取互补碱基
                    const complementaryBase = this.basePairs[templateBase];
                    
                    // 获取模板链碱基的颜色
                    const templateBaseIndex = effectivePrimer1Pos - i;
                    const baseColor = this.getBaseColorByIndex ? 
                        this.getBaseColorByIndex(templateBaseIndex) : '#00c2b4';
                    
                    // 绘制碱基
                    this.ctx.fillStyle = baseColor;
                    this.ctx.fillRect(baseX, newChainY7, this.baseWidth, this.baseHeight);
                    
                    // 添加黑色边框
                    this.ctx.strokeStyle = 'black';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(baseX, newChainY7, this.baseWidth, this.baseHeight);
                    
                    // 绘制碱基字母
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(complementaryBase, baseX + this.baseWidth/2, newChainY7 + this.baseHeight/2);
                    
                    // 绘制氢键
                    this.ctx.strokeStyle = 'black';
                    this.ctx.setLineDash([2, 2]);
                    
                    // 确定氢键数量 (A-T有2个，G-C有3个)
                    const numBonds = (templateBase === 'A' || templateBase === 'T') ? 2 : 3;
                    const bondSpacing = 6;
                    
                    // 计算第一个氢键的起始位置
                    const startX = baseX + this.baseWidth/2;
                    const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
                    
                    // 绘制氢键 - 连接到第7条链
                    for (let j = 0; j < numBonds; j++) {
                        const bondX = startX + firstBondOffset + j * bondSpacing;
                        this.ctx.beginPath();
                        this.ctx.moveTo(bondX, pair4TopY + this.baseHeight);
                        this.ctx.lineTo(bondX, newChainY7);
                        this.ctx.stroke();
                    }
                    
                    // 重置虚线样式
                    this.ctx.setLineDash([]);
                }
                
                // 绘制第4条链的延伸
                for (let i = 0; i < currentBasesToShow5; i++) {
                    // 计算当前碱基的X坐标，从左向右延伸
                    const baseX = extensionStartX5 + (i + 1) * this.baseWidth;
                    
                    // 获取对应的模板链碱基 - 使用第4条链自身作为模板
                    const templateIndex = effectivePrimer2Pos + window.primer2.length + i;
                    // 注意：第4条链是下链，应该使用bottomBase
                    const templateBase = this.basePairs[this.dnaSequence[templateIndex].topBase];
                    // 获取互补碱基 - 新链的碱基应该与模板链互补
                    const complementaryBase = this.basePairs[templateBase];
                    
                    // 获取模板链碱基的颜色
                    const templateBaseIndex = templateIndex;
                    const baseColor = this.getBaseColorByIndex ? 
                        this.getBaseColorByIndex(templateBaseIndex) : '#00c2b4';
                    
                    // 绘制碱基
                    this.ctx.fillStyle = baseColor;
                    this.ctx.fillRect(baseX, newChainY5, this.baseWidth, this.baseHeight);
                    
                    // 添加黑色边框
                    this.ctx.strokeStyle = 'black';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(baseX, newChainY5, this.baseWidth, this.baseHeight);
                    
                    // 绘制碱基字母 - 显示互补碱基
                    this.ctx.fillStyle = 'white';
                    this.ctx.font = '14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(complementaryBase, baseX + this.baseWidth/2, newChainY5 + this.baseHeight/2);
                    
                    // 绘制氢键
                    this.ctx.strokeStyle = 'black';
                    this.ctx.setLineDash([2, 2]);
                    
                    // 确定氢键数量 (A-T有2个，G-C有3个)
                    const numBonds = (templateBase === 'A' || templateBase === 'T') ? 2 : 3;
                    const bondSpacing = 6;
                    
                    // 计算第一个氢键的起始位置
                    const startX = baseX + this.baseWidth/2;
                    const firstBondOffset = -(numBonds - 1) * bondSpacing / 2;
                    
                    // 绘制氢键 - 连接到第4条链
                    for (let j = 0; j < numBonds; j++) {
                        const bondX = startX + firstBondOffset + j * bondSpacing;
                        this.ctx.beginPath();
                        this.ctx.moveTo(bondX, pair2BottomY);
                        this.ctx.lineTo(bondX, newChainY5 + this.baseHeight);
                        this.ctx.stroke();
                    }
                    
                    // 重置虚线样式
                    this.ctx.setLineDash([]);
                }
            }
            
            // 修改drawBase方法，确保始终有黑色边框并减小字体大小
            this.drawBase = function(x, y, base, isTopChain) {
                // 完全重写drawBase方法，而不是调用原始方法
                
                // 计算碱基的索引
                const baseIndex = Math.floor(x / this.baseWidth);
                
                // 判断是否在引物1的位置范围内（用于特殊颜色处理）
                const isPrimer1Position = (baseIndex >= effectivePrimer1Pos && baseIndex <= primer1EndPos);
                
                // 判断是否在引物2的位置范围内（用于特殊颜色处理）
                const isPrimer2Position = (baseIndex >= effectivePrimer2Pos && baseIndex <= primer2EndPos);
                
                // 判断当前绘制的是哪一条链
                const isChain2 = (y === pair1BottomY);
                const isChain3 = (y === pair2TopY);
                const isChain4 = (y === pair2BottomY);
                const isChain5 = (y === pair3TopY);
                const isChain6 = (y === pair3BottomY);
                const isChain7 = (y === pair4TopY);
                
                // 设置碱基颜色
                if ((isChain2 || isChain4 || isChain6) && isPrimer1Position) {
                    // 第2、4、6条链上的引物1位置使用引物颜色
                    this.ctx.fillStyle = '#F4AE08'; // 引物的橙色
                } else if ((isChain3 || isChain5 || isChain7) && isPrimer2Position) {
                    // 第3、5、7条链上的引物2位置使用引物颜色
                    this.ctx.fillStyle = '#F4AE08'; // 引物的橙色
                } else {
                    // 其他位置使用正常颜色
                    this.ctx.fillStyle = this.getBaseColorByIndex ? 
                        this.getBaseColorByIndex(baseIndex) : '#00c2b4'; // 默认青绿色
                }
                
                // 绘制碱基矩形
                this.ctx.fillRect(x, y, this.baseWidth, this.baseHeight);
                
                // 添加黑色边框
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(x, y, this.baseWidth, this.baseHeight);
                
                // 绘制碱基字母 - 使用小尺寸字体
                this.ctx.fillStyle = 'white';
                this.ctx.font = '14px Arial'; // 直接设置小字体
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(base, x + this.baseWidth/2, y + this.baseHeight/2);
            };
            
            // 添加带有透明度的氢键绘制方法
            this.drawHydrogenBondWithOpacity = function(x, topY, bottomY, base, opacity) {
                // 如果透明度为0，则不绘制氢键
                if (opacity <= 0) return;
                
                // 设置氢键样式 - 使用黑色并设置透明度
                this.ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
                this.ctx.setLineDash([2, 2]);
                
                // 确定氢键数量 (A-T有2个，G-C有3个)
                const numBonds = (base === 'A' || base === 'T') ? 2 : 3;
                const bondSpacing = 6; // 氢键之间的间距
                
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
                
                // 重置虚线样式
                this.ctx.setLineDash([]);
            };
            
            // 绘制第1对DNA双链
            for (let i = 0; i < numBases; i++) {
                const x = i * this.baseWidth;
                const { topBase, bottomBase } = this.dnaSequence[i];
                
                // 第1条链 - 完整显示
                this.drawBase(x, pair1TopY, topBase, true);
                
                // 第2条链 - 在引物1位置右侧不显示碱基
                if (i <= primer1EndPos || effectivePrimer1Pos === -1) {
                    this.drawBase(x, pair1BottomY, this.basePairs[topBase], false);
                    // 绘制氢键 - 使用新的方法，根据进度计算透明度
                    const opacity = 1 - progress;
                    this.drawHydrogenBondWithOpacity(x, pair1TopY, pair1BottomY, topBase, opacity);
                }
            }
            
            // 绘制第2对DNA双链
            for (let i = 0; i < numBases; i++) {
                const x = i * this.baseWidth;
                const { topBase, bottomBase } = this.dnaSequence[i];
                
                // 第3条链 - 在引物2位置左侧和引物1位置右侧不显示碱基
                if (i >= effectivePrimer2Pos && i <= primer1EndPos) {
                    this.drawBase(x, pair2TopY, topBase, true);
                }
                
                // 第4条链 - 在引物1位置右侧不显示碱基
                if (i <= primer1EndPos) {
                    this.drawBase(x, pair2BottomY, this.basePairs[topBase], false);
                }
                
                // 绘制氢键 - 使用新的方法，根据进度计算透明度
                if (i >= effectivePrimer2Pos && i <= primer1EndPos) {
                    const opacity = 1 - progress;
                    this.drawHydrogenBondWithOpacity(x, pair2TopY, pair2BottomY, topBase, opacity);
                }
            }
            
            // 绘制第3对DNA双链
            for (let i = 0; i < numBases; i++) {
                const x = i * this.baseWidth;
                const { topBase, bottomBase } = this.dnaSequence[i];
                
                // 第5条链 - 在引物2位置左侧不显示碱基
                if (i >= effectivePrimer2Pos || effectivePrimer2Pos === -1) {
                    this.drawBase(x, pair3TopY, topBase, true);
                }
                
                // 第6条链 - 在引物2位置左侧和引物1位置右侧不显示碱基
                if ((i >= effectivePrimer2Pos && i <= primer1EndPos) || effectivePrimer2Pos === -1) {
                    this.drawBase(x, pair3BottomY, this.basePairs[topBase], false);
                    // 绘制氢键 - 使用新的方法，根据进度计算透明度
                    const opacity = 1 - progress;
                    this.drawHydrogenBondWithOpacity(x, pair3TopY, pair3BottomY, topBase, opacity);
                }
            }
            
            // 绘制第4对DNA双链
            for (let i = 0; i < numBases; i++) {
                const x = i * this.baseWidth;
                const { topBase, bottomBase } = this.dnaSequence[i];
                
                // 第7条链 - 在引物2位置左侧不显示碱基
                if (i >= effectivePrimer2Pos || effectivePrimer2Pos === -1) {
                    this.drawBase(x, pair4TopY, topBase, true);
                }
                
                // 第8条链 - 正常显示
                this.drawBase(x, pair4BottomY, this.basePairs[topBase], false);
                
                // 绘制氢键 - 使用新的方法，根据进度计算透明度
                if (i >= effectivePrimer2Pos || effectivePrimer2Pos === -1) {
                    const opacity = 1 - progress;
                    this.drawHydrogenBondWithOpacity(x, pair4TopY, pair4BottomY, topBase, opacity);
                }
            }
            
            // 如果正在退火且完全变性（progress = 1），绘制引物1和引物2
            if (this.isAnnealing && progress === 1) {
                // 定义所有需要绘制引物1的链的Y坐标
                const primer1Positions = [
                    { topY: pair1TopY, label: "第1条链" },
                    { topY: pair2TopY, label: "第3条链" },
                    { topY: pair3TopY, label: "第5条链" },
                    { topY: pair4TopY, label: "第7条链" }
                ];
                
                // 为每条链绘制引物1
                primer1Positions.forEach(({ topY, label }) => {
                    // 计算引物1的位置（在链下方0.1cm处）
                    const primer1Y = topY + this.baseHeight + 10; // 10像素约等于0.1cm
                    
                    // 绘制引物背景
                    this.ctx.fillStyle = '#F4AE08';  // 淡黄色半透明背景
                    this.ctx.fillRect(
                        this.primer1Position * this.baseWidth,
                        primer1Y,
                        this.baseWidth * window.primer1.length,
                        this.baseHeight
                    );
                    
                    // 绘制引物碱基和氢键
                    for (let i = 0; i < window.primer1.length; i++) {
                        const baseX = this.primer1Position * this.baseWidth + i * this.baseWidth;
                        
                        // 绘制引物碱基 - 使用淡黄色
                        this.ctx.fillStyle = '#F4AE08'; // 更和谐的黄色(金黄色)
                        this.ctx.fillRect(baseX, primer1Y, this.baseWidth, this.baseHeight);
                        
                        // 添加黑色边框
                        this.ctx.strokeStyle = 'black';
                        this.ctx.lineWidth = 1;
                        this.ctx.strokeRect(baseX, primer1Y, this.baseWidth, this.baseHeight);
                        
                        // 绘制碱基字母
                        this.ctx.fillStyle = 'white'; // 改为白色文字
                        this.ctx.font = '14px Arial'; // 减小字体大小
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(window.primer1[i], baseX + this.baseWidth/2, primer1Y + this.baseHeight/2);
                        
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
                            this.ctx.moveTo(bondX, topY + this.baseHeight); // 从DNA链碱基底部开始
                            this.ctx.lineTo(bondX, primer1Y); // 到引物碱基顶部
                            this.ctx.stroke();
                        }
                        
                        // 重置虚线样式
                        this.ctx.setLineDash([]);
                    }
                    
                    console.log(`在${label}下方生成了引物1`);
                });
                
                // 在第2、4、6、8条链上方绘制引物2
                const primer2Positions = [
                    { bottomY: pair1BottomY, label: "第2条链" },
                    { bottomY: pair2BottomY, label: "第4条链" },
                    { bottomY: pair3BottomY, label: "第6条链" },
                    { bottomY: pair4BottomY, label: "第8条链" }
                ];
                
                // 设置引物2位置
                const numBases = this.dnaSequence.length;
                const effectivePrimer2Pos = (primer2Pos !== -1 && !isNaN(primer2Pos)) ? 
                    primer2Pos : Math.floor(numBases * 2 / 3);
                
                // 为每条链绘制引物2
                primer2Positions.forEach(({ bottomY, label }) => {
                    const primer2Y = bottomY - this.baseHeight - 10; // 在链上方0.1cm处
                    
                    // 绘制引物2背景
                    this.ctx.fillStyle = '#F4AE08';  // 淡黄色半透明背景
                    this.ctx.fillRect(
                        effectivePrimer2Pos * this.baseWidth,
                        primer2Y,
                        this.baseWidth * window.primer2.length,
                        this.baseHeight
                    );
                    
                    // 绘制引物2碱基和氢键
                    for (let i = 0; i < window.primer2.length; i++) {
                        const baseX = effectivePrimer2Pos * this.baseWidth + i * this.baseWidth;
                        
                        // 绘制引物碱基 - 使用淡黄色
                        this.ctx.fillStyle = '#F4AE08'; // 金黄色
                        this.ctx.fillRect(baseX, primer2Y, this.baseWidth, this.baseHeight);
                        
                        // 添加黑色边框
                        this.ctx.strokeStyle = 'black';
                        this.ctx.lineWidth = 1;
                        this.ctx.strokeRect(baseX, primer2Y, this.baseWidth, this.baseHeight);
                        
                        // 绘制碱基字母
                        this.ctx.fillStyle = 'white'; // 改为白色文字
                        this.ctx.font = '14px Arial'; // 减小字体大小
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(window.primer2[i], baseX + this.baseWidth/2, primer2Y + this.baseHeight/2);
                        
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
                            this.ctx.moveTo(bondX, primer2Y + this.baseHeight); // 从引物碱基底部开始
                            this.ctx.lineTo(bondX, bottomY); // 到DNA链碱基顶部
                            this.ctx.stroke();
                        }
                        
                        // 重置虚线样式
                        this.ctx.setLineDash([]);
                    }
                    
                    console.log(`在${label}的引物2位置(${effectivePrimer2Pos})上方生成了引物2`);
                });
            }
            
            // 绘制每对链的5'和3'标签
            this.ctx.font = 'bold 14px Arial';
            this.ctx.fillStyle = 'black';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 第1对双链标签
            // 上链标签
            this.ctx.fillText("5'", this.baseWidth/2, pair1TopY - 15);
            this.ctx.fillText("3'", (numBases - 0.5) * this.baseWidth, pair1TopY - 15);
            // 下链标签 - 将5'标志移动到引物1位置右侧
            this.ctx.fillText("3'", this.baseWidth/2, pair1BottomY + this.baseHeight + 15);
            this.ctx.fillText("5'", (primer1EndPos + 0.5) * this.baseWidth, pair1BottomY + this.baseHeight + 15);
            
            // 第2对双链标签
            // 上链标签 - 将5'标志移动到引物2位置左侧，3'标志移动到引物1位置右侧
            this.ctx.fillText("5'", (effectivePrimer2Pos - 0.5) * this.baseWidth, pair2TopY + this.baseHeight);
            this.ctx.fillText("3'", (primer1EndPos + 0.5) * this.baseWidth, pair2TopY - 15);
            // 下链标签 - 将5'标志移动到引物1位置右侧
            this.ctx.fillText("3'", this.baseWidth/2, pair2BottomY + this.baseHeight + 15);
            this.ctx.fillText("5'", (primer1EndPos + 0.5) * this.baseWidth, pair2BottomY + this.baseHeight + 15);
            
            // 第3对双链标签
            // 上链标签 - 将5'标志移动到引物2位置左侧
            this.ctx.fillText("5'", (effectivePrimer2Pos - 0.5) * this.baseWidth, pair3TopY + this.baseHeight - 5);
            this.ctx.fillText("3'", (numBases - 0.5) * this.baseWidth, pair3TopY - 15);
            // 下链标签 - 将3'标志移动到引物2位置左侧，5'标志移动到引物1位置右侧
            this.ctx.fillText("3'", (effectivePrimer2Pos - 0.5) * this.baseWidth, pair3BottomY + this.baseHeight - 5);
            this.ctx.fillText("5'", (primer1EndPos + 0.5) * this.baseWidth, pair3BottomY + this.baseHeight + 15);
            
            // 第4对双链标签
            // 上链标签 - 将5'标志移动到引物2位置左侧
            this.ctx.fillText("5'", (effectivePrimer2Pos - 0.5) * this.baseWidth, pair4TopY + this.baseHeight - 5);
            this.ctx.fillText("3'", (numBases - 0.5) * this.baseWidth, pair4TopY - 15);
            // 下链标签
            this.ctx.fillText("3'", this.baseWidth/2, pair4BottomY + this.baseHeight + 15);
            this.ctx.fillText("5'", (numBases - 0.5) * this.baseWidth, pair4BottomY + this.baseHeight + 15);
            
            // 恢复原始的drawBase方法和碱基高度
            this.drawBase = originalDrawBase;
            this.baseHeight = originalBaseHeight;
            
            // 在最上层绘制DNA聚合酶 - 确保显示在所有其他元素之上
            if (this.isExtending) {
                // 计算第1条链延伸的相关参数
                const extensionStartX1 = effectivePrimer1Pos * this.baseWidth;
                const newChainY1 = pair1TopY + this.baseHeight + 10;
                const extensionLength1 = effectivePrimer1Pos + 1;
                const currentBasesToShow1 = Math.floor(extensionLength1 * this.extensionProgress);
                
                // 计算当前位置 - 随着延伸进度向左移动
                const polymeraseX = extensionStartX1 - (currentBasesToShow1 * this.baseWidth) + this.baseWidth/2;
                const polymeraseY = newChainY1 - 25;
                
                // 绘制橙色圆形代表DNA聚合酶
                this.ctx.beginPath();
                this.ctx.arc(polymeraseX, polymeraseY, 24, 0, Math.PI * 2);
                this.ctx.fillStyle = '#FF8C00'; // 橙色
                this.ctx.fill();
                this.ctx.strokeStyle = '#FF8C00'; // 深橙色边框
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                // 添加字母"DNA 聚合酶"
                this.ctx.fillStyle = 'black';
                this.ctx.font = 'bold 9px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText("耐热", polymeraseX, polymeraseY - 5);
                this.ctx.fillText("DNA聚合酶", polymeraseX, polymeraseY + 5);
                
                console.log("绘制DNA聚合酶，位置:", polymeraseX, polymeraseY);
                
                // 为第3条链添加DNA聚合酶
                if (this.isExtending) {
                    // 计算第3条链延伸的相关参数
                    const extensionStartX4 = effectivePrimer1Pos * this.baseWidth;
                    const newChainY4 = pair2TopY + this.baseHeight + 10;
                    const extensionLength4 = effectivePrimer1Pos - effectivePrimer2Pos + 1;
                    const currentBasesToShow4 = Math.floor(extensionLength4 * this.extensionProgress);
                    
                    // 计算第3条链DNA聚合酶的当前位置 - 随着延伸进度向左移动
                    const polymerase3X = extensionStartX4 - (currentBasesToShow4 * this.baseWidth) + this.baseWidth/2;
                    const polymerase3Y = newChainY4 - 25;
                    
                    // 绘制橙色圆形代表第3条链的DNA聚合酶
                    this.ctx.beginPath();
                    this.ctx.arc(polymerase3X, polymerase3Y, 24, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#FF8C00'; // 橙色
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#FF8C00'; // 深橙色边框
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    
                    // 添加字母"DNA 聚合酶"
                    this.ctx.fillStyle = 'black';
                    this.ctx.font = 'bold 9px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText("耐热", polymerase3X, polymerase3Y - 5);
                    this.ctx.fillText("DNA聚合酶", polymerase3X, polymerase3Y + 5);
                    
                    console.log("绘制第3条链DNA聚合酶，位置:", polymerase3X, polymerase3Y);
                }
                
                // 为第5条链添加DNA聚合酶
                if (this.isExtending) {
                    // 计算第5条链延伸的相关参数
                    const chain5ExtensionStartX = effectivePrimer1Pos * this.baseWidth;
                    const chain5NewY = pair3TopY + this.baseHeight + 10;
                    const chain5ExtensionLength = effectivePrimer1Pos - effectivePrimer2Pos + 1;
                    const chain5CurrentBasesToShow = Math.floor(chain5ExtensionLength * this.extensionProgress);
                    
                    // 计算第5条链DNA聚合酶的当前位置 - 随着延伸进度向左移动
                    const polymerase5X = chain5ExtensionStartX - (chain5CurrentBasesToShow * this.baseWidth) + this.baseWidth/2;
                    const polymerase5Y = chain5NewY - 25;
                    
                    // 绘制橙色圆形代表第5条链的DNA聚合酶
                    this.ctx.beginPath();
                    this.ctx.arc(polymerase5X, polymerase5Y, 24, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#FF8C00'; // 橙色
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#FF8C00'; // 深橙色边框
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    
                    // 添加字母"DNA 聚合酶"
                    this.ctx.fillStyle = 'black';
                    this.ctx.font = 'bold 9px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText("耐热", polymerase5X, polymerase5Y - 5);
                    this.ctx.fillText("DNA聚合酶", polymerase5X, polymerase5Y + 5);
                    
                    console.log("绘制第5条链DNA聚合酶，位置:", polymerase5X, polymerase5Y);
                }
                
                // 为第7条链添加DNA聚合酶
                if (this.isExtending) {
                    // 计算第7条链延伸的相关参数
                    const extensionStartX7 = effectivePrimer1Pos * this.baseWidth;
                    const newChainY7 = pair4TopY + this.baseHeight + 10;
                    const extensionLength7 = effectivePrimer1Pos - effectivePrimer2Pos + 1;
                    const currentBasesToShow7 = Math.floor(extensionLength7 * this.extensionProgress);
                    
                    // 计算第7条链DNA聚合酶的当前位置 - 随着延伸进度向左移动
                    const polymerase7X = extensionStartX7 - (currentBasesToShow7 * this.baseWidth) + this.baseWidth/2;
                    const polymerase7Y = newChainY7 - 25;
                    
                    // 绘制橙色圆形代表第7条链的DNA聚合酶
                    this.ctx.beginPath();
                    this.ctx.arc(polymerase7X, polymerase7Y, 24, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#FF8C00'; // 橙色
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#FF8C00'; // 深橙色边框
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    
                    // 添加字母"DNA 聚合酶"
                    this.ctx.fillStyle = 'black';
                    this.ctx.font = 'bold 9px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText("耐热", polymerase7X, polymerase7Y - 5);
                    this.ctx.fillText("DNA聚合酶", polymerase7X, polymerase7Y + 5);
                    
                    console.log("绘制第7条链DNA聚合酶，位置:", polymerase7X, polymerase7Y);
                }
                
                // 为第2条链添加DNA聚合酶 - 从引物2位置开始向右移动
                if (this.isExtending) {
                    // 计算第2条链延伸的相关参数
                    const extensionStartX2 = (effectivePrimer2Pos + window.primer2.length - 1) * this.baseWidth;
                    const newChainY2 = pair1BottomY - this.baseHeight - 10;
                    const extensionLength2 = primer1EndPos - (effectivePrimer2Pos + window.primer2.length - 1);
                    const currentBasesToShow2 = Math.floor(extensionLength2 * this.extensionProgress);
                    
                    // 计算第2条链DNA聚合酶的当前位置 - 随着延伸进度向右移动
                    const polymerase2X = extensionStartX2 + (currentBasesToShow2 * this.baseWidth) - this.baseWidth/2 + 70;
                    const polymerase2Y = newChainY2 + 35;
                    
                    // 绘制橙色圆形代表第2条链的DNA聚合酶
                    this.ctx.beginPath();
                    this.ctx.arc(polymerase2X, polymerase2Y, 24, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#FF8C00'; // 橙色
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#FF8C00'; // 深橙色边框
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    
                    // 添加字母"DNA 聚合酶"
                    this.ctx.fillStyle = 'black';
                    this.ctx.font = 'bold 9px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText("耐热", polymerase2X, polymerase2Y - 5);
                    this.ctx.fillText("DNA聚合酶", polymerase2X, polymerase2Y + 5);
                    
                    console.log("绘制第2条链DNA聚合酶，位置:", polymerase2X, polymerase2Y);
                }
                
                // 为第4条链添加DNA聚合酶 - 从引物2位置开始向右移动
                if (this.isExtending) {
                    // 计算第4条链延伸的相关参数
                    const extensionStartX5 = (effectivePrimer2Pos + window.primer2.length - 1) * this.baseWidth;
                    const newChainY5 = pair2BottomY - this.baseHeight - 10;
                    const extensionLength5 = primer1EndPos - (effectivePrimer2Pos + window.primer2.length - 1);
                    const currentBasesToShow5 = Math.floor(extensionLength5 * this.extensionProgress);
                    
                    // 计算第4条链DNA聚合酶的当前位置 - 随着延伸进度向右移动
                    const polymerase4X = extensionStartX5 + (currentBasesToShow5 * this.baseWidth) - this.baseWidth/2 + 70;
                    const polymerase4Y = newChainY5 + 35;
                    
                    // 绘制橙色圆形代表第4条链的DNA聚合酶
                    this.ctx.beginPath();
                    this.ctx.arc(polymerase4X, polymerase4Y, 24, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#FF8C00'; // 橙色
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#FF8C00'; // 深橙色边框
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    
                    // 添加字母"DNA 聚合酶"
                    this.ctx.fillStyle = 'black';
                    this.ctx.font = 'bold 9px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText("耐热", polymerase4X, polymerase4Y - 5);
                    this.ctx.fillText("DNA聚合酶", polymerase4X, polymerase4Y + 5);
                    
                    console.log("绘制第4条链DNA聚合酶，位置:", polymerase4X, polymerase4Y);
                }
                
                // 为第6条链添加DNA聚合酶 - 从引物2位置开始向右移动
                if (this.isExtending) {
                    // 计算第6条链延伸的相关参数
                    const extensionStartX6 = (effectivePrimer2Pos + window.primer2.length - 1) * this.baseWidth;
                    const newChainY6 = pair3BottomY - this.baseHeight - 10;
                    const extensionLength6 = primer1EndPos - (effectivePrimer2Pos + window.primer2.length - 1);
                    const currentBasesToShow6 = Math.floor(extensionLength6 * this.extensionProgress);
                    
                    // 计算第6条链DNA聚合酶的当前位置 - 随着延伸进度向右移动
                    const polymerase6X = extensionStartX6 + (currentBasesToShow6 * this.baseWidth) - this.baseWidth/2 + 70;
                    const polymerase6Y = newChainY6 + 35;
                    
                    // 绘制橙色圆形代表第6条链的DNA聚合酶
                    this.ctx.beginPath();
                    this.ctx.arc(polymerase6X, polymerase6Y, 24, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#FF8C00'; // 橙色
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#FF8C00'; // 深橙色边框
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    
                    // 添加字母"DNA 聚合酶"
                    this.ctx.fillStyle = 'black';
                    this.ctx.font = 'bold 9px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText("耐热", polymerase6X, polymerase6Y - 5);
                    this.ctx.fillText("DNA聚合酶", polymerase6X, polymerase6Y + 5);
                    
                    console.log("绘制第6条链DNA聚合酶，位置:", polymerase6X, polymerase6Y);
                }
                
                // 为第8条链添加DNA聚合酶 - 从引物2位置开始向右移动
                if (this.isExtending) {
                    // 计算第8条链延伸的相关参数
                    const extensionStartX3 = (effectivePrimer2Pos + window.primer2.length - 1) * this.baseWidth;
                    const newChainY3 = pair4BottomY - this.baseHeight - 10;
                    const extensionLength3 = numBases - (effectivePrimer2Pos + window.primer2.length);
                    const currentBasesToShow3 = Math.floor(extensionLength3 * this.extensionProgress);
                    
                    // 计算第8条链DNA聚合酶的当前位置 - 随着延伸进度向右移动
                    const polymerase8X = extensionStartX3 + (currentBasesToShow3 * this.baseWidth) - this.baseWidth/2 + 70;
                    const polymerase8Y = newChainY3 + 35;
                    
                    // 绘制橙色圆形代表第8条链的DNA聚合酶
                    this.ctx.beginPath();
                    this.ctx.arc(polymerase8X, polymerase8Y, 24, 0, Math.PI * 2);
                    this.ctx.fillStyle = '#FF8C00'; // 橙色
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#FF8C00'; // 深橙色边框
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    
                    // 添加字母"DNA 聚合酶"
                    this.ctx.fillStyle = 'black';
                    this.ctx.font = 'bold 9px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText("耐热", polymerase8X, polymerase8Y - 5);
                    this.ctx.fillText("DNA聚合酶", polymerase8X, polymerase8Y + 5);
                    
                    console.log("绘制第8条链DNA聚合酶，位置:", polymerase8X, polymerase8Y);
                }
            }
        };
        
        // 设置变性状态
        dna.isDenatured = false;
        dna.isDenaturing = true;
        
        // 动画持续时间（3秒）
        const animationDuration = 3000; // 3秒
        const startTime = Date.now();
        
        // 执行动画
        function animate() {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / animationDuration, 1);
            
            // 绘制当前状态
            dna.drawWithDenaturation(progress);
            
            // 继续动画或完成
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 变性完成
                dna.isDenatured = true;
                dna.isDenaturing = false;
                
                // 启用退火按钮
                const annealBtn = document.getElementById('annealBtn');
                if (annealBtn) {
                    annealBtn.disabled = false;
                }
                
                console.log("变性动画完成");
            }
        }
        
        // 禁用其他按钮直到变性完成
        const annealBtn = document.getElementById('annealBtn');
        const extendBtn = document.getElementById('extendBtn');
        const cycleBtn = document.getElementById('cycleBtn');
        
        if (annealBtn) annealBtn.disabled = true;
        if (extendBtn) extendBtn.disabled = true;
        if (cycleBtn) cycleBtn.disabled = true;
        
        // 开始动画
        console.log("开始变性动画");
        animate();
    }
    
    console.log("PCR交互系统 - 循环3初始化完成");
}); 
