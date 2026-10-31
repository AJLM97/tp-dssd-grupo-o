package com.rentar.verificationservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.kafka.support.converter.RecordMessageConverter;
import org.springframework.kafka.support.converter.StringJacksonJsonMessageConverter;

@SpringBootApplication
public class VerificationServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(VerificationServiceApplication.class, args);
	}

	// Los eventos llegan como texto JSON y se convierten al tipo del parametro de cada @KafkaListener
	@Bean
	public RecordMessageConverter messageConverter() {
		return new StringJacksonJsonMessageConverter();
	}

}
