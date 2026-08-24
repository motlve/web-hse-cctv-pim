package utils

import (
	"crypto/rand"
	"fmt"
	"math/big"
)

func GenerateOTP() string {

	max := big.NewInt(900000)

	number, err := rand.Int(rand.Reader, max)

	if err != nil {
		return "000000"
	}

	otp := number.Int64() + 100000

	return fmt.Sprintf("%06d", otp)
}