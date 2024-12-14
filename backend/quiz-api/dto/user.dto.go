package dto

// RegisterRequest represents the structure for user registration
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	FullName string `json:"fullname" binding:"required"`
}

// RegisterResponse represents the response after successful registration
type RegisterResponse struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
}

// LoginRequest represents the structure for user login
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse represents the response for successful login
type LoginResponse struct {
	ID       uint   `json:"id"`
	Username string `json:"username"`
	FullName string `json:"fullname"`
	IsAdmin  bool   `json:"is_admin"`
	Token    string `json:"token"`
}

// ChangePasswordRequest represents the structure for changing password
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}
