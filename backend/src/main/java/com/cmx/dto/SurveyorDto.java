package com.cmx.dto;

public class SurveyorDto {

    public record SurveyorResponse(
            Long id,
            String code,
            String displayName,
            Double homeLat,
            Double homeLng,
            String status,
            String surveyorType,
            String email,
            String phone,
            String currentStatus
    ) {}

    public record SurveyorContact(
            Long id,
            String name,
            String email,
            String phone
    ) {
        public boolean hasEmail() {
            return email != null && !email.isBlank();
        }

        public boolean hasPhone() {
            return phone != null && !phone.isBlank();
        }
    }
}
