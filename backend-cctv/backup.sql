-- MySQL dump 10.13  Distrib 8.4.9, for Linux (x86_64)
--
-- Host: localhost    Database: db_hse_cctv_pim
-- ------------------------------------------------------
-- Server version	8.4.9

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `category_models`
--

DROP TABLE IF EXISTS `category_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_models`
--

LOCK TABLES `category_models` WRITE;
/*!40000 ALTER TABLE `category_models` DISABLE KEYS */;
/*!40000 ALTER TABLE `category_models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `id_cctv`
--

DROP TABLE IF EXISTS `id_cctv`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `id_cctv` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `id_camera` varchar(100) NOT NULL,
  `id_nvr` longtext NOT NULL,
  `lokasi` longtext,
  `area` longtext,
  `kondisi` longtext,
  `jumlah_error` bigint DEFAULT NULL,
  `jumlah_request` bigint DEFAULT NULL,
  `jumlah_on_kembali` bigint DEFAULT NULL,
  `jumlah_durasi_error` longtext,
  `average_durasi_x_error` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_id_cctv_id_camera` (`id_camera`),
  KEY `idx_id_cctv_deleted_at` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `id_cctv`
--

LOCK TABLES `id_cctv` WRITE;
/*!40000 ALTER TABLE `id_cctv` DISABLE KEYS */;
/*!40000 ALTER TABLE `id_cctv` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `incident_record`
--

DROP TABLE IF EXISTS `incident_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incident_record` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `datetime_of_incident` datetime(3) DEFAULT NULL,
  `location` longtext,
  `category` longtext,
  `description_of_incident` longtext,
  `name_officer` longtext,
  `information` longtext,
  `datetime_complete` datetime(3) DEFAULT NULL,
  `duration` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `incident_record`
--

LOCK TABLES `incident_record` WRITE;
/*!40000 ALTER TABLE `incident_record` DISABLE KEYS */;
/*!40000 ALTER TABLE `incident_record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `list_camera_trouble`
--

DROP TABLE IF EXISTS `list_camera_trouble`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_camera_trouble` (
  `id_camera` varchar(50) NOT NULL,
  `tanggal_input` datetime(3) DEFAULT NULL,
  `lokasi` longtext,
  `lokasi_detail` longtext,
  `keterangan` longtext,
  `petugas` longtext,
  `start_error` datetime(3) DEFAULT NULL,
  `request_perbaikan` datetime(3) DEFAULT NULL,
  `selesai_perbaikan` datetime(3) DEFAULT NULL,
  `status` longtext,
  `durasi_error` longtext,
  `response_time` longtext,
  `average_response` longtext,
  PRIMARY KEY (`id_camera`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `list_camera_trouble`
--

LOCK TABLES `list_camera_trouble` WRITE;
/*!40000 ALTER TABLE `list_camera_trouble` DISABLE KEYS */;
/*!40000 ALTER TABLE `list_camera_trouble` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `location_models`
--

DROP TABLE IF EXISTS `location_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `location_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` longtext,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `location_models`
--

LOCK TABLES `location_models` WRITE;
/*!40000 ALTER TABLE `location_models` DISABLE KEYS */;
/*!40000 ALTER TABLE `location_models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `officer_models`
--

DROP TABLE IF EXISTS `officer_models`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `officer_models` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `name_officer` longtext,
  `gender` longtext,
  `role` longtext,
  PRIMARY KEY (`id`),
  KEY `idx_officer_models_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `officer_models`
--

LOCK TABLES `officer_models` WRITE;
/*!40000 ALTER TABLE `officer_models` DISABLE KEYS */;
INSERT INTO `officer_models` VALUES (1,'2026-06-11 22:31:50.373','2026-06-11 22:31:50.373',NULL,'Rizky Aditiyo','Laki-laki','Petugas CCTV');
/*!40000 ALTER TABLE `officer_models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `summary_request_camera`
--

DROP TABLE IF EXISTS `summary_request_camera`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `summary_request_camera` (
  `id_camera` varchar(50) NOT NULL,
  `tanggal_request` datetime(3) DEFAULT NULL,
  `lokasi` longtext,
  `lokasi_detail` longtext,
  `tanggal_pemasangan` datetime(3) DEFAULT NULL,
  `status` longtext,
  `progress_days` bigint DEFAULT NULL,
  `input_database` longtext,
  `keterangan` longtext,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id_camera`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `summary_request_camera`
--

LOCK TABLES `summary_request_camera` WRITE;
/*!40000 ALTER TABLE `summary_request_camera` DISABLE KEYS */;
/*!40000 ALTER TABLE `summary_request_camera` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) DEFAULT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `username` varchar(100) NOT NULL,
  `password` longtext,
  `role` longtext,
  `fullname` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_username` (`username`),
  KEY `idx_users_deleted_at` (`deleted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'2026-06-11 22:29:29.195','2026-06-11 22:29:29.195',NULL,'32502','$2a$10$KdiI2NxPtVjTP7n.86vwyednDgfrnaLAfh1ss9ZUtHxgTbJF8DGTy','Manager HSE','Yudha Pranata');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-11 15:45:07
