function Input({style, ...props}) {
    return (
        <input style={{
            borderRadius: '12px',
            padding: '10px',
            ...style,
        }} {...props}/>
    )
}

export default Input