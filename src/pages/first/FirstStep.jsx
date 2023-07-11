import "./FirstStep.css";
import { AutoComplete, DatePicker, Input, Select, Badge } from "antd";
import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import dayjs from "dayjs";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/semantic-ui.css";

export default function FirstStep({
  setCarInfo,
  carInfo,
  setUserData,
  userData,
  setNextButtonDisabled,
  apiBaseUrl,
  totalPercentage,
  setTotalPercentage,
  prevBirthDate,
  prevName,
  prevPhone,
  prevTrim,
  prevYear,
  carMakeOptions,
  carWithYearOptions,
  setCarWithYearOptions,
  setCarMakeOptions,
  showDotStatusModelField,
  setShowDotStatusModelField,
  showDotStatusTrimField,
  setshowDotStatusTrimField,
  showDotStatusNameField,
  setShowDotStatusNameField,
  showDotStatusPhoneField,
  setShowDotStatusPhoneField,
  showDotStatusBirthdateField,
  setShowDotStatusBirthdateField,
  trimOptions,
  setTrimOptions,
  setPopularModels,
  popularModels,
}) {
  const _ = require("lodash");

  const [isMounted, setIsMounted] = useState(false);
  const [carMakeInput, setCarMakeInput] = useState("");
  const [carDropdownFocus, setCarDropdownFocus] = useState(false);
  const [trimOptionsOpen, setTrimOptionsOpen] = useState(false); // trim dropdown disabled before user choose model + year

  // Perecentage parameters for totalPercentage update
  const percentageParams = {
    modelYear: 10,
    trim: 4,
    name: 11,
    phone: 12,
    birthDate: 13,
    // name: 12,
    // phone: 12,
    // birthDate: 12,
  };

  const { RangePicker } = DatePicker;
  const dateFormat = "YYYY/MM/DD";

  if (totalPercentage === 100) {
    setNextButtonDisabled("");
  }

  // get popular models
  useEffect(() => {
    setIsMounted(true);

    axios.get(apiBaseUrl + "popular/").then((response) => {
      const mappedResponse = response.data.map((item) => {
        return {
          value: `${item.make.make} ${item.model}`,
          id: item.id,
          label: `${item.make.make} ${item.model}`,
        };
      });

      setPopularModels(mappedResponse);
      setCarMakeOptions(
        carMakeOptions.length ? carMakeOptions : mappedResponse
      );
    });
  }, []);

  useEffect(() => {
    if (!carInfo.year) return;

    getTrims(); // call API to get all trims for selected model year
    onChangeFocus(false);
    setShowDotStatusModelField(true);
    setTrimOptionsOpen(true); // open trims dropdown
  }, [carInfo.year]);

  const onChangeFocus = (value) => {
    if (isMounted) {
      setCarDropdownFocus(value);
    }
  };

  useEffect(() => {
    if (!isMounted) return;

    if (!carMakeInput.length) {
      setCarMakeOptions(popularModels || []);
    }
    const hasYear = carInfo.year;
    const hasModel = carInfo.model;

    if (!hasYear && !hasModel) {
      debauncedSearchModels(carMakeInput);
    }

    const inputIncludesYear = carMakeInput.includes(carInfo.year?.value);
    const inputIncludesModel = carMakeInput.includes(carInfo.model?.value);

    if (hasYear && !inputIncludesYear) {
      setCarInfo({
        model: carInfo.model,
        year: null,
        trim: null,
      });

      onChangeFocus(false);
      onChangeFocus(true);

      setCarMakeOptions(carWithYearOptions);
      setShowDotStatusModelField(false);
    }

    if (hasModel && !inputIncludesModel) {
      setCarInfo({
        model: null,
        year: carInfo.year,
        trim: carInfo.trim,
      });

      debauncedSearchModels(carMakeInput);
    }
  }, [carMakeInput]);

  // Increase totalPercentage when model year is selected
  useEffect(() => {
    if (!prevYear.current && carInfo.model && carInfo.year) {
      setTotalPercentage(totalPercentage + percentageParams.modelYear);
    }

    if (!carInfo.year && prevYear.current) {
      setTotalPercentage(totalPercentage - percentageParams.modelYear);
    }

    prevYear.current = carInfo.year;
  }, [carInfo.model, carInfo.year]);

  // Increase totalPercentage when trim is selected
  useEffect(() => {
    if (carInfo.trim && !prevTrim.current) {
      setTotalPercentage(totalPercentage + percentageParams.trim);
    }
    if (!carInfo.trim && prevTrim.current) {
      setTotalPercentage(
        totalPercentage - (percentageParams.trim + percentageParams.modelYear)
      );
    }

    prevTrim.current = carInfo.trim;
  }, [carInfo.trim]);

  // Increase total percentage if name input is filled
  useEffect(() => {
    if (!prevName.current && userData.name) {
      setTotalPercentage(totalPercentage + percentageParams.name);
      setShowDotStatusNameField(true);
    }
    if (prevName.current && !userData.name) {
      setTotalPercentage(totalPercentage - percentageParams.name);
      setShowDotStatusNameField(false);
    }
    prevName.current = userData.name;
  }, [userData.name]);

  // Increase totalPercentage when phone is filled
  useEffect(() => {
    if (!prevPhone.current && userData.phone) {
      setTotalPercentage(totalPercentage + percentageParams.phone);
      setShowDotStatusPhoneField(true);
    }

    if (prevPhone.current && !userData.phone) {
      setTotalPercentage(totalPercentage - percentageParams.phone);
      setShowDotStatusPhoneField(false);
    }

    prevPhone.current = userData.phone;
  }, [userData.phone]);

  // Increase totalPercentage when userBirthDate is filled
  useEffect(() => {
    if (!prevBirthDate.current && userData.birthDate) {
      setTotalPercentage(totalPercentage + percentageParams.birthDate);
      setShowDotStatusBirthdateField(true);
    }
    if (!userData.birthDate && prevBirthDate.current) {
      setTotalPercentage(totalPercentage - percentageParams.birthDate);
      setShowDotStatusBirthdateField(false);
    }
    prevBirthDate.current = userData.birthDate;
  }, [userData.birthDate]);

  const onSelectCarInput = (value, option) => {
    setCarMakeInput(value);

    if (!carInfo.model) {
      setCarInfo({
        model: option,
        year: carInfo.year,
        trim: carInfo.trim,
      });

      getModelYears(option);
      return;
    }

    setCarInfo({
      model: carInfo.model,
      year: option,
      trim: carInfo.trim,
    });
  };

  const onTrimSelect = (value, option) => {
    setTrimOptionsOpen(false);
    setCarInfo({
      model: carInfo.model,
      year: carInfo.year,
      trim: option,
    });
    setshowDotStatusTrimField(true);
  };

  const onNameInput = (value, option) => {
    // setName(value);
    setUserData({
      name: value,
      phone: userData.phone,
      birthDate: userData.birthDate,
      driverLicence: null,
      yearIssued: null,
    });
  };

  const onDateInput = (date, dateString) => {
    setUserData({
      name: userData.name,
      phone: userData.phone,
      birthDate: dateString,
      driverLicence: null,
      yearIssued: null,
    });
  };

  const onPhoneInput = (value, option) => {
    setUserData({
      name: userData.name,
      phone: value,
      birthDate: userData.birthDate,
      driverLicence: null,
      yearIssued: null,
    });
  };

  const getTrims = () => {
    if (!carInfo.year || !carInfo.model) return;

    const yearId = carInfo.year.id;
    const modelId = carInfo.model.id;
    axios
      // .get(apiBaseUrl + `trims/?year=${yearId}&model=${modelId}`)
      .get(apiBaseUrl + `trims/?model_id=${modelId}`)
      .then(function ({ data }) {
        const mappedResponse = data.map((item) => {
          return {
            id: item.id,
            label: item.trim,
            value: item.trim,
          };
        });
        setTrimOptions(mappedResponse);
      });
  };

  const getModelYears = (option) => {
    axios.get(apiBaseUrl + `model/${option.id}/year`).then(function ({ data }) {
      const mappedResponse = data.map((item) => {
        return {
          id: item.id,
          label: `${option.label} ${item.year}`,
          value: `${option.label}, ${item.year}`,
        };
      });
      setCarMakeOptions(mappedResponse);
      setCarWithYearOptions(mappedResponse);
    });
  };

  const searchModels = (text) => {
    if (text) {
      axios
        .get(apiBaseUrl + "search-models/?search=" + text)
        .then(function (response) {
          const mappedResponse = response.data.map((item) => {
            return {
              value: `${item.make__make} ${item.model}`,
              id: item.id,
              label: `${item.make__make} ${item.model}`,
            };
          });
          setCarMakeOptions(mappedResponse);
        });
    }
  };

  const debauncedSearchModels = _.debounce((text) => {
    searchModels(text);
  }, 1000);

  return (
    <div className="calc__body">
      <div className="calc__form">
        <form>
          <h3>Fill in vehicle information</h3>
          <p>
            Start typing the make and model of your car to select from the list
          </p>
          <Badge
            count={`${percentageParams.modelYear}%`}
            color="#A3ECB3"
            status="success"
            dot={showDotStatusModelField}
          >
            <AutoComplete
              id="make-model-year"
              options={carMakeOptions}
              style={{ width: 345, marginBottom: 20 }}
              open={carDropdownFocus}
              onSelect={onSelectCarInput}
              value={carInfo.year || carInfo.model || carMakeInput}
              onFocus={() => {
                onChangeFocus(true);
              }}
              onBlur={() => {
                onChangeFocus(false);
              }}
              onSearch={(text) => {
                setCarMakeInput(text);
                setTrimOptionsOpen(false);
              }}
              placeholder="Make, model, year"
              renderOption={(option) => {
                return (
                  <>
                    <div>{`${option.label}`}</div>
                  </>
                );
              }}
            />
          </Badge>
          <Badge
            count={`${percentageParams.trim}%`}
            color="#A3ECB3"
            dot={showDotStatusTrimField}
          >
            <Select
              id="trim-select"
              options={trimOptions}
              open={trimOptionsOpen}
              onDropdownVisibleChange={(visible) => setTrimOptionsOpen(visible)}
              onSelect={onTrimSelect}
              value={carInfo.trim}
              onFocus={() => {
                setTrimOptionsOpen(true);
              }}
              onBlur={() => {
                setTrimOptionsOpen(false);
              }}
              style={{ width: 345, marginBottom: 20 }}
              placeholder="Trim"
            />
          </Badge>
          <h4>Driver details</h4>
          <Badge
            count={`${percentageParams.name}%`}
            color="#A3ECB3"
            dot={showDotStatusNameField}
          >
            <Input
              name="nameInput"
              style={{ width: 345, marginBottom: 20 }}
              placeholder="John Smith"
              onChange={(e) => onNameInput(e.target.value)}
              value={userData.name}
            />
          </Badge>
          <Badge
            count={`${percentageParams.phone}%`}
            color="#A3ECB3"
            dot={showDotStatusPhoneField}
          >
            <PhoneInput
              className="phone-input-container"
              inputClass="phone-input"
              country={"ca"}
              onChange={(value) => onPhoneInput(value)}
              value={userData.phone}
            />
          </Badge>
          <Badge
            count={`${percentageParams.birthDate}%`}
            color="#A3ECB3"
            dot={showDotStatusBirthdateField}
          >
            <DatePicker
              name="birthDateInput"
              placeholder="Date of birth"
              // defaultValue={dayjs("1987/12/01", dateFormat)}
              format={dateFormat}
              style={{ width: 345, marginBottom: 20 }}
              onChange={onDateInput}
              value={
                userData.birthDate
                  ? dayjs(userData.birthDate, dateFormat)
                  : null
              }
            />
          </Badge>
        </form>
      </div>
      <div className="calc__progress">
        <div className="calc__progress_total">
          <p>Completed to show the exact cost:</p>
          <h3>{totalPercentage}%</h3>
        </div>
        <div
          className="progress"
          style={{
            backgroundColor: "#A3ECB3",
            height: "10px",
            borderRadius: "50px",
          }}
        >
          <div
            style={{
              width: `${totalPercentage}%`,
              backgroundColor: "#39B54A",
              height: "100%",
              borderRadius: "50px",
            }}
          ></div>
        </div>

        <p>+50% for the 1st step</p>
      </div>
    </div>
  );
}
