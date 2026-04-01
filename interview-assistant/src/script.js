// 面试问题库
const interviewQuestions = [
    {
        title: "技术问题",
        content: "请解释什么是闭包，以及它在 JavaScript 中的应用场景",
        tips: ["闭包是指有权访问另一个函数作用域中变量的函数", "常见应用场景包括：模块化、私有变量、函数柯里化等", "闭包可能会导致内存泄漏，需要注意"]
    },
    {
        title: "行为问题",
        content: "描述一次你在团队中解决冲突的经历",
        tips: ["使用 STAR 法则：情境（Situation）、任务（Task）、行动（Action）、结果（Result）", "重点突出你的沟通能力和问题解决能力", "展示你如何考虑团队整体利益"]
    },
    {
        title: "技术问题",
        content: "请解释 RESTful API 的设计原则",
        tips: ["无状态性：服务器不保存客户端状态", "使用 HTTP 方法：GET、POST、PUT、DELETE 等", "资源标识：使用 URI 标识资源", "统一接口：使用标准的 HTTP 状态码和头部"]
    },
    {
        title: "行为问题",
        content: "你如何处理工作中的压力和挑战？",
        tips: ["分享具体的应对策略", "展示你如何保持冷静和专注", "举例说明你如何在压力下完成任务"]
    },
    {
        title: "技术问题",
        content: "请解释什么是响应式设计，以及如何实现",
        tips: ["响应式设计是指网站能够根据不同设备的屏幕尺寸自动调整布局", "实现方法包括：媒体查询、弹性布局、流式网格等", "考虑移动优先的设计原则"]
    }
];

// DOM 元素
const interviewForm = document.getElementById('interview-form');
const inputSection = document.querySelector('.input-section');
const interviewSection = document.getElementById('interview-section');
const questionCard = document.getElementById('question-card');
const questionTitle = document.getElementById('question-title');
const questionContent = document.getElementById('question-content');
const questionTips = document.getElementById('question-tips');
const answerInput = document.getElementById('answer-input');
const submitAnswerBtn = document.getElementById('submit-answer');
const skipQuestionBtn = document.getElementById('skip-question');
const feedback = document.getElementById('feedback');

// 当前问题索引
let currentQuestionIndex = 0;

// 表单提交处理
interviewForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const jobTitle = document.getElementById('job-title').value;
    const jobDescription = document.getElementById('job-description').value;
    
    if (!jobTitle) {
        alert('请输入职位名称');
        return;
    }
    
    // 显示面试部分，隐藏输入部分
    inputSection.style.display = 'none';
    interviewSection.style.display = 'block';
    
    // 加载第一个问题
    loadQuestion(currentQuestionIndex);
});

// 加载问题
function loadQuestion(index) {
    const question = interviewQuestions[index];
    
    questionTitle.textContent = question.title;
    questionContent.textContent = question.content;
    
    // 渲染提示
    questionTips.innerHTML = `
        <h4>提示：</h4>
        <ul>
            ${question.tips.map(tip => `<li>${tip}</li>`).join('')}
        </ul>
    `;
    
    // 清空答案输入和反馈
    answerInput.value = '';
    feedback.style.display = 'none';
}

// 提交答案
submitAnswerBtn.addEventListener('click', function() {
    const answer = answerInput.value.trim();
    
    if (!answer) {
        alert('请输入你的答案');
        return;
    }
    
    // 生成反馈
    generateFeedback(answer);
});

// 跳过问题
skipQuestionBtn.addEventListener('click', function() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < interviewQuestions.length) {
        loadQuestion(currentQuestionIndex);
    } else {
        // 面试结束
        questionCard.innerHTML = '<h3>面试结束</h3><p>感谢你的参与！</p>';
        answerInput.style.display = 'none';
        document.querySelector('.answer-actions').style.display = 'none';
    }
});

// 生成反馈
function generateFeedback(answer) {
    // 简单的反馈生成逻辑
    let feedbackContent = '';
    
    if (answer.length < 50) {
        feedbackContent = '<h3>反馈</h3><p>你的回答比较简短，建议提供更详细的解释和例子。</p>';
    } else if (answer.length > 200) {
        feedbackContent = '<h3>反馈</h3><p>你的回答很详细，但可以更加简洁明了，突出重点。</p>';
    } else {
        feedbackContent = '<h3>反馈</h3><p>你的回答长度适中，内容充实。继续保持！</p>';
    }
    
    feedback.innerHTML = feedbackContent;
    feedback.style.display = 'block';
    
    // 3秒后加载下一个问题
    setTimeout(() => {
        currentQuestionIndex++;
        
        if (currentQuestionIndex < interviewQuestions.length) {
            loadQuestion(currentQuestionIndex);
        } else {
            // 面试结束
            questionCard.innerHTML = '<h3>面试结束</h3><p>感谢你的参与！</p>';
            answerInput.style.display = 'none';
            document.querySelector('.answer-actions').style.display = 'none';
            feedback.style.display = 'none';
        }
    }, 3000);
}