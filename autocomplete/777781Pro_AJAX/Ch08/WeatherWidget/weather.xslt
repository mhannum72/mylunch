<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="xml" omit-xml-declaration="yes" indent="yes" />
	
	<xsl:template match="/">
		<div id="weatherContainer">
			<xsl:apply-templates />
		</div>
	</xsl:template>
	
	<!-- Weather Feed Begins -->
	<xsl:template match="weather">
			<xsl:apply-templates select="loc"/>
			<xsl:apply-templates select="cc"/>
	</xsl:template>
	
	<!-- Location Information -->
	<xsl:template match="loc">
		<div id="weatherLocation"><xsl:value-of select="dnam"/></div>
		<div id="weatherTime">Last Update:
			<span><xsl:value-of select="tm"/></span>
		</div>
	</xsl:template>
	
	<!-- Current Conditions -->
	<xsl:template match="cc">
		<xsl:variable name="weatherIcon" select="icon" />
		<div id="weatherIcon"><img src="img/weather/{$weatherIcon}.png" /></div>
		<div id="weatherTemp"><xsl:value-of select="tmp"/></div>
		<div id="weatherWind">Wind:
			<div><xsl:value-of select="wind/s"/> MPH <xsl:value-of select="wind/t"/></div>
		</div>
	</xsl:template>
	
	<!-- Error Document Begins-->
	<xsl:template match="errorDoc">
		<div id="weatherErrorAlert"><xsl:value-of select="alert"/></div>
		<div id="weatherErrorMessage"><xsl:value-of select="message"/></div>
	</xsl:template>

</xsl:stylesheet>

