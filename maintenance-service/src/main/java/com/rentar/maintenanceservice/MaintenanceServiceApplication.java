package com.rentar.maintenanceservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.kafka.support.converter.RecordMessageConverter;
import org.springframework.kafka.support.converter.StringJacksonJsonMessageConverter;

@SpringBootApplication
@EnableAsync
public class MaintenanceServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(MaintenanceServiceApplication.class, args);
	}

	// Los eventos llegan como texto JSON y se convierten al tipo del parametro de cada @KafkaListener
	@Bean
	public RecordMessageConverter messageConverter() {
		return new StringJacksonJsonMessageConverter();
	}

}
