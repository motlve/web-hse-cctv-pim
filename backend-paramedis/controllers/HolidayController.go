package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
)


type Holiday struct {

	Date string `json:"date"`

	LocalName string `json:"localName"`

	Name string `json:"name"`

	CountryCode string `json:"countryCode"`

}



func GetNationalHoliday(
	w http.ResponseWriter,
	r *http.Request,
){

	year :=
	r.URL.Query().Get("year")


	if year == "" {

		year = "2026"

	}



	url :=
	fmt.Sprintf(
		"https://date.nager.at/api/v3/PublicHolidays/%s/ID",
		year,
	)



	resp,err :=
	http.Get(url)



	if err != nil {

		http.Error(
			w,
			err.Error(),
			500,
		)

		return

	}



	defer resp.Body.Close()



	var holidays []Holiday



	err =
	json.NewDecoder(
		resp.Body,
	).Decode(
		&holidays,
	)



	if err != nil {

		http.Error(
			w,
			err.Error(),
			500,
		)

		return

	}



	w.Header().Set(
		"Content-Type",
		"application/json",
	)



	json.NewEncoder(w).Encode(holidays)


}