package config

import (
	"fmt"
	"log"
	"os"
	"quiz-api/models"

	"github.com/joho/godotenv"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var MIGRATE_MODELS = []interface{}{
	&models.User{},
	&models.Quiz{},
	&models.Question{},
	&models.Answer{},
}

func InitDB() *gorm.DB {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to the database: %v", err)
	}
	autoMigrate(db)
	return db
}

func autoMigrate(db *gorm.DB) {
	db.AutoMigrate(MIGRATE_MODELS...)
	createAdminUser(db)
}

func createAdminUser(db *gorm.DB) {
	var existingAdmin models.User

	// Check if an admin user already exists
	if err := db.Where("is_admin = ?", true).First(&existingAdmin).Error; err == nil {
		fmt.Println("Admin user already exists. Skipping creation.")
		return
	}

	// Hash the password for security
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Failed to hash admin password:", err)
	}

	// Create the admin user
	adminUser := models.User{
		Username: "admin",
		Password: string(hashedPassword),
		FullName: "Administrator",
		IsAdmin:  true,
	}

	// Save the admin user to the database
	if err := db.Create(&adminUser).Error; err != nil {
		log.Fatal("Failed to create admin user:", err)
	}

	user1Password, _ := bcrypt.GenerateFromPassword([]byte("user1"), bcrypt.DefaultCost)
	user1 := models.User{
		Username: "user1",
		Password: string(user1Password),
		FullName: "User 1",
		IsAdmin:  false,
	}
	// Save the admin user to the database
	if err := db.Create(&user1).Error; err != nil {
		log.Fatal("Failed to create user1:", err)
	}

	user2Password, _ := bcrypt.GenerateFromPassword([]byte("user2"), bcrypt.DefaultCost)
	user2 := models.User{
		Username: "user2",
		Password: string(user2Password),
		FullName: "User 2",
		IsAdmin:  false,
	}
	// Save the admin user to the database
	if err := db.Create(&user2).Error; err != nil {
		log.Fatal("Failed to create user2:", err)
	}

	fmt.Println("Admin user and user exmaple are created successfully!")
}
