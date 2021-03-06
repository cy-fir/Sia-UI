import React, { PropTypes } from 'react'

const PasswordPrompt = ({password, error, actions}) => {
	const onPasswordChange = (e) => actions.handlePasswordChange(e.target.value)
	const onUnlockClick = () => actions.unlockWallet(password)
	return (
		<div className="password-prompt">
			<span> Please enter your wallet unlock password to continue. </span>
			<i className="fa fa-lock fa-4x"></i>
			<input value={password} className="password-input" onChange={onPasswordChange} />
			<button onClick={onUnlockClick}>Unlock</button>
			<div className="password-prompt-error">{error}</div>
		</div>
	)
}
PasswordPrompt.propTypes = {
	password: PropTypes.string.isRequired,
	error: PropTypes.string,
}

export default PasswordPrompt
