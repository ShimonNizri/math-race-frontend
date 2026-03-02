function Button({children, style, ...props}) {
    return (
        <button style={style} {...props}>
            {children}
        </button>
    )
}

export default Button