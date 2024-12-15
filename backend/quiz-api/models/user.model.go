package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UUID      string    `gorm:"type:char(36);uniqueIndex" json:"uuid"`
	Username  string    `gorm:"unique;not null" json:"username"`
	FullName  string    `gorm:"unique;not null" json:"fullname"`
	Password  string    `gorm:"not null" json:"password"`
	IsAdmin   bool      `gorm:"default:false" json:"is_admin"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (u *User) BeforeCreate(tx *gorm.DB) (err error) {
	if u.UUID == "" {
		u.UUID = uuid.New().String()
	}
	return
}
