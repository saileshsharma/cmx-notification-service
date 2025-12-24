package com.cmx.exception;

public class OfferExpiredException extends RuntimeException {

    private final String offerGroup;

    public OfferExpiredException(String offerGroup) {
        super(String.format("Offer %s has expired or already been taken", offerGroup));
        this.offerGroup = offerGroup;
    }

    public String getOfferGroup() {
        return offerGroup;
    }
}
