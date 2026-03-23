import { useState } from 'react';
export default function Test() {
    const [count, setCount] = useState(0);
    const addClick = () => {
        setCount(count + 1);
    };
    return (
        <div>
        <h2>Test Component</h2>
        <p>这是一个测试组件</p>
        <button onClick={addClick}>
            点击次数: {count}
        </button>
        </div>
    )
}
