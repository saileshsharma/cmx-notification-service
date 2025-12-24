package com.cmx.calendar;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jdbc.repository.config.EnableJdbcRepositories;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableCaching
@ComponentScan(basePackages = "com.cmx")
@EnableJdbcRepositories(basePackages = "com.cmx.repository")
public class SurveyorCalendarApiApplication {
  public static void main(String[] args) {
    SpringApplication.run(SurveyorCalendarApiApplication.class, args);
  }
}
