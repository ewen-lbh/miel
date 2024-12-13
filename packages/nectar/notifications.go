package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"

	ll "github.com/ewen-lbh/label-logger-go"

	firebase "firebase.google.com/go"
	"firebase.google.com/go/messaging"
	"github.com/ewen-lbh/miel/db"
	"google.golang.org/api/option"
)

// FirebaseConfig represents the structure of google-services.json
type FirebaseConfig struct {
	ProjectInfo struct {
		ProjectNumber string `json:"project_number"`
		ProjectID     string `json:"project_id"`
	} `json:"project_info"`
	Client []struct {
		ClientInfo struct {
			AndroidClientInfo struct {
				PackageName string `json:"package_name"`
			} `json:"android_client_info"`
		} `json:"client_info"`
	} `json:"client"`
}

// loadFirebaseConfig reads and parses the google-services.json file
func loadFirebaseConfig(filepath string) (*FirebaseConfig, error) {
	data, err := os.ReadFile(filepath)
	if err != nil {
		return nil, fmt.Errorf("error reading google-services.json: %v", err)
	}

	var config FirebaseConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, fmt.Errorf("error parsing google-services.json: %v", err)
	}

	return &config, nil
}

// initFirebaseApp initializes Firebase app with the configuration
func initFirebaseApp(configPath string) (*firebase.App, error) {
	ctx := context.Background()

	// Load Firebase configuration
	_, err := loadFirebaseConfig(configPath)
	if err != nil {
		return nil, err
	}

	// Initialize Firebase app with the service account
	opt := option.WithCredentialsFile(configPath)
	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		return nil, fmt.Errorf("error initializing firebase app: %v", err)
	}

	return app, nil
}

// sendPushNotification sends a notification to all devices of a specific user
func sendPushNotification(userID, title, body, clickAction string) error {
	ll.Log("Notifying", "cyan", "user %q with %q", userID, title)
	// get all device tokens
	devices, err := prisma.Device.FindMany(
		db.Device.UserID.Equals(userID),
	).Select(
		db.Device.NotificationsToken.Field(),
	).Exec(ctx)

	if err != nil {
		return fmt.Errorf("couldn't get all device tokens for user %q: %w", userID, err)
	}

	// send notification to each device
	for _, device := range devices {
		go func(deviceToken string) {
			if err := sendPushNotificationToDevice(deviceToken, title, body, clickAction); err != nil {
				ll.ErrorDisplay("Couldn't send push notification to device %q", err, deviceToken)
			}
		}(device.NotificationsToken)
	}

	return nil
}

// sendPushNotificationToDevice sends a notification to a specific device token
func sendPushNotificationToDevice(deviceToken string, title, body, clickAction string) error {
	ctx := context.Background()

	// Create a Messaging client
	client, err := firebaseApp.Messaging(ctx)
	if err != nil {
		return fmt.Errorf("error getting messaging client: %v", err)
	}

	// Compose the message
	message := &messaging.Message{
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Token: deviceToken,
		Android: &messaging.AndroidConfig{
			Priority: "high",
			Data: map[string]string{
				"click_action": clickAction,
			},
		},
	}

	// Send the message
	_, err = client.Send(ctx, message)
	if err != nil {
		return fmt.Errorf("error sending message: %v", err)
	}

	return nil
}

var firebaseApp *firebase.App

func init() {
	// Path to your google-services.json file
	configPath := "./google-services.json"

	// Initialize Firebase app
	var err error
	firebaseApp, err = initFirebaseApp(configPath)
	if err != nil {
		log.Fatalf("Failed to initialize Firebase app: %v", err)
	}

}
