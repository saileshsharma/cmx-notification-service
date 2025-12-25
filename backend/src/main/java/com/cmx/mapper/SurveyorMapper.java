package com.cmx.mapper;

import com.cmx.dto.SurveyorDto.SurveyorResponse;
import com.cmx.dto.SurveyorDto.SurveyorContact;
import com.cmx.model.Surveyor;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * MapStruct mapper for Surveyor entity to DTO conversions.
 * Generates type-safe mapping code at compile time.
 */
@Mapper(componentModel = "spring")
public interface SurveyorMapper {

    /**
     * Convert Surveyor entity to SurveyorResponse DTO
     */
    SurveyorResponse toResponse(Surveyor surveyor);

    /**
     * Convert list of Surveyor entities to SurveyorResponse DTOs
     */
    List<SurveyorResponse> toResponseList(List<Surveyor> surveyors);

    /**
     * Convert Surveyor entity to SurveyorContact DTO
     */
    @Mapping(source = "displayName", target = "name")
    SurveyorContact toContact(Surveyor surveyor);

    /**
     * Convert list of Surveyor entities to SurveyorContact DTOs
     */
    List<SurveyorContact> toContactList(List<Surveyor> surveyors);
}
