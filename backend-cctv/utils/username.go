package utils

import (
	"fmt"
	"math/rand"
	"strings"
	"time"
)


func GenerateUsername(role string, fullname string) string {


	rand.Seed(time.Now().UnixNano())


	number := rand.Intn(90000)+10000


	prefix := "USR"


	switch role {

	case "Admin":
		prefix="ADM"

	case "Manager HSE":
		prefix="MHS"

	case "Petugas CCTV":
		prefix="CCTV"

	case "Petugas HSE":
		prefix="HSE"

	}



	name := strings.ToUpper(fullname)


	name = strings.ReplaceAll(
		name,
		" ",
		"",
	)


	if len(name)>10 {
		name=name[:10]
	}



	return fmt.Sprintf(
		"%s-%s-%d",
		prefix,
		name,
		number,
	)

}