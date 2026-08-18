package controllers

import (
	"backend/config"
	"backend/models"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/gorilla/mux"
)

// ===================== HELPERS =====================

func calcDuration(start, end time.Time) string {

	if start.IsZero() || end.IsZero() {
		return "00:00:00"
	}

	duration := end.Sub(start)

	if duration <= 0 {
		return "00:00:00"
	}

	h := int(duration.Hours())
	m := int(duration.Minutes()) % 60
	s := int(duration.Seconds()) % 60

	return fmt.Sprintf("%02d:%02d:%02d", h, m, s)
}


// VALIDASI TIME POINTER
func isValidTime(t *time.Time) bool {

	if t == nil {
		return false
	}

	if t.IsZero() {
		return false
	}

	return true
}


func minutesToHHMMSS(minutes float64) string {

	totalSeconds := int(minutes * 60)

	h := totalSeconds / 3600
	m := (totalSeconds % 3600) / 60
	s := totalSeconds % 60

	return fmt.Sprintf("%02d:%02d:%02d", h, m, s)
}


// ===================== GET ALL =====================

func GetAllCameraTrouble(w http.ResponseWriter, r *http.Request) {

	var troubles []models.ListCameraTrouble


	if err := config.DB.Find(&troubles).Error; err != nil {

		http.Error(w, err.Error(),500)
		return
	}



	for _, t := range troubles {

		fmt.Println(
			"CCTV:",
			t.IDCamera,
			"REQUEST:",
			t.RequestPerbaikan,
			"SELESAI:",
			t.SelesaiPerbaikan,
			"RESPONSE:",
			t.ResponseTime,
		)

	}


	json.NewEncoder(w).Encode(troubles)
}


// ===================== GET BY ID =====================

func GetCameraTroubleByID(
	w http.ResponseWriter,
	r *http.Request,
){

	id := mux.Vars(r)["id"]


	var trouble models.ListCameraTrouble


	if err := config.DB.
		Where("id = ?",id).
		First(&trouble).Error; err != nil {


		http.Error(
			w,
			"Data tidak ditemukan",
			http.StatusNotFound,
		)

		return
	}


	json.NewEncoder(w).Encode(trouble)
}


// ===================== CREATE =====================

func CreateCameraTrouble(
	w http.ResponseWriter,
	r *http.Request,
){


	var input models.ListCameraTrouble


	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {

		http.Error(
			w,
			err.Error(),
			400,
		)

		return
	}



	if input.IDCamera == "" {

		http.Error(
			w,
			"id_camera wajib diisi",
			400,
		)

		return
	}



	input.TanggalInput=time.Now()



	// =====================
	// STATUS ENGINE
	// =====================

	switch {


	case isValidTime(input.SelesaiPerbaikan):

		input.Status =
			"Selesai Perbaikan/On Kembali"


	case isValidTime(input.RequestPerbaikan):

		input.Status =
			"Request Perbaikan"


	case !input.StartError.IsZero():

		input.Status =
			"Error"


	default:

		input.Status =
			"Kamera Dilepas"

	}



	// =====================
	// DURASI ERROR
	// START ERROR -> SELESAI
	// =====================


	if isValidTime(input.SelesaiPerbaikan) &&
		!input.StartError.IsZero(){


		input.DurasiError =
			calcDuration(
				input.StartError,
				*input.SelesaiPerbaikan,
			)


	}else{

		input.DurasiError=
			"00:00:00"

	}



	// =====================
	// RESPONSE TIME
	// REQUEST -> SELESAI
	// =====================


	if isValidTime(input.RequestPerbaikan) &&
		isValidTime(input.SelesaiPerbaikan){


		input.ResponseTime =
			calcDuration(
				*input.RequestPerbaikan,
				*input.SelesaiPerbaikan,
			)


	}else{


		input.ResponseTime=
			"00:00:00"

	}



	input.AverageResponse=
		input.ResponseTime



	if err:=config.DB.Create(&input).Error; err != nil {

		http.Error(
			w,
			err.Error(),
			500,
		)

		return
	}



	updateStatisticCCTV(input.IDCamera)

	updateAverageResponse()



	json.NewEncoder(w).Encode(map[string]interface{}{

		"message":
			"Data berhasil ditambahkan",

		"data":
			input,

	})

}

// ===================== UPDATE =====================

func UpdateCameraTrouble(
	w http.ResponseWriter,
	r *http.Request,
) {


	id := mux.Vars(r)["id"]


	fmt.Println("========== UPDATE CAMERA TROUBLE ==========")
	fmt.Println("ID :", id)



	var trouble models.ListCameraTrouble



	if err:=config.DB.First(&trouble,id).Error; err != nil {

		http.Error(
			w,
			"Data tidak ditemukan",
			http.StatusNotFound,
		)

		return
	}



	var input models.ListCameraTrouble



	if err:=json.NewDecoder(r.Body).Decode(&input); err != nil {

		http.Error(
			w,
			err.Error(),
			http.StatusBadRequest,
		)

		return
	}



	// ==========================
	// UPDATE DATA
	// ==========================


	trouble.IDCamera =
		input.IDCamera

	trouble.Lokasi =
		input.Lokasi

	trouble.LokasiDetail =
		input.LokasiDetail

	trouble.Keterangan =
		input.Keterangan

	trouble.Petugas =
		input.Petugas


	trouble.StartError =
		input.StartError


	trouble.RequestPerbaikan =
		input.RequestPerbaikan


	trouble.SelesaiPerbaikan =
		input.SelesaiPerbaikan



	// ==========================
	// STATUS ENGINE
	// ==========================


	switch {


	case isValidTime(trouble.SelesaiPerbaikan):

		trouble.Status =
			"Selesai Perbaikan/On Kembali"



	case isValidTime(trouble.RequestPerbaikan):

		trouble.Status =
			"Request Perbaikan"



	case !trouble.StartError.IsZero():

		trouble.Status =
			"Error"



	default:

		trouble.Status =
			"Kamera Dilepas"

	}




	// ==========================
	// DURASI ERROR
	// START ERROR -> SELESAI
	// ==========================


	if isValidTime(trouble.SelesaiPerbaikan) &&
		!trouble.StartError.IsZero(){


		trouble.DurasiError =
			calcDuration(
				trouble.StartError,
				*trouble.SelesaiPerbaikan,
			)


	}else{


		trouble.DurasiError =
			"00:00:00"

	}




	// ==========================
	// RESPONSE TIME
	// REQUEST -> SELESAI
	// ==========================


	if isValidTime(trouble.RequestPerbaikan) &&
		isValidTime(trouble.SelesaiPerbaikan){



		trouble.ResponseTime =
			calcDuration(
				*trouble.RequestPerbaikan,
				*trouble.SelesaiPerbaikan,
			)



	}else{


		trouble.ResponseTime =
			"00:00:00"

	}




	trouble.AverageResponse =
		trouble.ResponseTime





	if err:=config.DB.Save(&trouble).Error; err != nil {


		fmt.Println(
			"SAVE ERROR :",
			err,
		)


		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)


		return
	}




	updateStatisticCCTV(
		trouble.IDCamera,
	)


	updateAverageResponse()



	w.Header().Set(
		"Content-Type",
		"application/json",
	)



	json.NewEncoder(w).Encode(map[string]interface{}{


		"message":
			"Data berhasil diperbarui",


		"data":
			trouble,

	})


}



// ===================== DELETE =====================

func DeleteCameraTrouble(
	w http.ResponseWriter,
	r *http.Request,
) {


	id:=mux.Vars(r)["id"]


	fmt.Println(
		"========== DELETE ==========",
	)

	fmt.Println(
		"ID :",
		id,
	)



	var trouble models.ListCameraTrouble



	if err:=config.DB.First(&trouble,id).Error; err != nil {


		http.Error(
			w,
			"Data tidak ditemukan",
			http.StatusNotFound,
		)


		return
	}



	idCamera :=
		trouble.IDCamera




	if err:=config.DB.Delete(&trouble).Error; err != nil {


		http.Error(
			w,
			err.Error(),
			http.StatusInternalServerError,
		)


		return
	}



	updateStatisticCCTV(
		idCamera,
	)


	updateAverageResponse()



	json.NewEncoder(w).Encode(map[string]string{


		"message":
			"Data berhasil dihapus",

	})

}



// ===================== AVERAGE RESPONSE =====================

func updateAverageResponse() {


	var troubles []models.ListCameraTrouble



	config.DB.Find(&troubles)



	var total float64

	var count int



	for _,t:=range troubles {


		if t.ResponseTime=="" ||
			t.ResponseTime=="00:00:00" {

			continue
		}



		var h,m,s int



		fmt.Sscanf(
			t.ResponseTime,
			"%d:%d:%d",
			&h,
			&m,
			&s,
		)



		total +=
			float64(h*60+m)+
			float64(s)/60



		count++

	}



	avg :=
		"00:00:00"



	if count>0 {


		avg =
			minutesToHHMMSS(
				total/float64(count),
			)

	}



	err :=
		config.DB.
			Model(&models.ListCameraTrouble{}).
			Where("1 = 1").
			Update(
				"average_response",
				avg,
			).Error



	if err != nil {


		fmt.Println(
			"UPDATE AVG ERROR :",
			err,
		)

	}


}



// ===================== UPDATE CCTV STAT =====================

func updateStatisticCCTV(
	idCamera string,
) {


	var cctv models.IDCCTVModels



	if err :=
		config.DB.
			Where(
				"id_camera = ?",
				idCamera,
			).
			First(&cctv).Error; err == nil {



		_ =
			cctv.RecalculateStats()

	}

}

// ===================== CREATE BULK =====================

func CreateCameraTroubleBulk(
	w http.ResponseWriter,
	r *http.Request,
) {

	var input struct {
		Items []struct {
			IDCamera     string `json:"id_camera"`
			LokasiDetail string `json:"lokasi_detail"`
		} `json:"items"`

		Lokasi     string `json:"lokasi"`
		Petugas    string `json:"petugas"`
		Keterangan string `json:"keterangan"`

		StartError       *time.Time `json:"start_error"`
		RequestPerbaikan *time.Time `json:"request_perbaikan"`
		SelesaiPerbaikan *time.Time `json:"selesai_perbaikan"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if len(input.Items) == 0 {
		http.Error(w, "items wajib diisi minimal satu", http.StatusBadRequest)
		return
	}

	type FailedItem struct {
		IDCamera string `json:"id_camera"`
		Error    string `json:"error"`
	}

	type BulkResult struct {
		Success []string     `json:"success"`
		Failed  []FailedItem `json:"failed"`
	}

	result := BulkResult{
		Success: []string{},
		Failed:  []FailedItem{},
	}

	tx := config.DB.Begin()

	for _, item := range input.Items {

		if item.IDCamera == "" {
			result.Failed = append(result.Failed, FailedItem{
				IDCamera: item.IDCamera,
				Error:    "id_camera kosong",
			})
			continue
		}

		trouble := models.ListCameraTrouble{
			IDCamera:     item.IDCamera,
			LokasiDetail: item.LokasiDetail,
			Lokasi:       input.Lokasi,
			Petugas:      input.Petugas,
			Keterangan:   input.Keterangan,

			TanggalInput: time.Now(),
		}

		if input.StartError != nil {
			trouble.StartError = *input.StartError
		}

		trouble.RequestPerbaikan = input.RequestPerbaikan
		trouble.SelesaiPerbaikan = input.SelesaiPerbaikan

		// =====================
		// STATUS ENGINE
		// =====================

		switch {

		case isValidTime(trouble.SelesaiPerbaikan):
			trouble.Status = "Selesai Perbaikan/On Kembali"

		case isValidTime(trouble.RequestPerbaikan):
			trouble.Status = "Request Perbaikan"

		case !trouble.StartError.IsZero():
			trouble.Status = "Error"

		default:
			trouble.Status = "Kamera Dilepas"
		}

		// =====================
		// DURASI ERROR
		// =====================

		if isValidTime(trouble.SelesaiPerbaikan) && !trouble.StartError.IsZero() {
			trouble.DurasiError = calcDuration(trouble.StartError, *trouble.SelesaiPerbaikan)
		} else {
			trouble.DurasiError = "00:00:00"
		}

		// =====================
		// RESPONSE TIME
		// =====================

		if isValidTime(trouble.RequestPerbaikan) && isValidTime(trouble.SelesaiPerbaikan) {
			trouble.ResponseTime = calcDuration(*trouble.RequestPerbaikan, *trouble.SelesaiPerbaikan)
		} else {
			trouble.ResponseTime = "00:00:00"
		}

		trouble.AverageResponse = trouble.ResponseTime

		if err := tx.Create(&trouble).Error; err != nil {

			result.Failed = append(result.Failed, FailedItem{
				IDCamera: item.IDCamera,
				Error:    err.Error(),
			})

			continue
		}

		result.Success = append(result.Success, item.IDCamera)
	}

	// Kalau semua gagal, rollback total
	if len(result.Success) == 0 {
		tx.Rollback()

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)

		json.NewEncoder(w).Encode(map[string]interface{}{
			"message": "Semua data gagal disimpan",
			"result":  result,
		})

		return
	}

	if err := tx.Commit().Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Update statistik untuk tiap kamera yang berhasil
	for _, idCamera := range result.Success {
		updateStatisticCCTV(idCamera)
	}

	updateAverageResponse()

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": fmt.Sprintf("%d dari %d data berhasil ditambahkan", len(result.Success), len(input.Items)),
		"result":  result,
	})
}