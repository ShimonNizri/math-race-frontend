function Card({children, style, ...props}) {
    return (
        <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            ...style,
        }} {...props}>
            {children}
        </div>
    )
}

export default Card