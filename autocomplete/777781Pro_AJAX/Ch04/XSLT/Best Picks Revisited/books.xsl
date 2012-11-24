<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="xml" omit-xml-declaration="yes" indent="yes" />

<xsl:template match="/">
		<xsl:apply-templates />
</xsl:template>

<xsl:template match="book">
	<div class="bookContainer">
		<xsl:variable name="isbn" select="@isbn" />
		<xsl:variable name="title" select="title" />
		<img class="bookCover" alt="{$title}" src="images/{$isbn}.png" />
		<div class="bookContent">
			<h3><xsl:value-of select="$title" /></h3>
			Written by: <xsl:value-of select="author" /><br />
			ISBN #<xsl:value-of select="$isbn" />
			<div class="bookPublisher"><xsl:value-of select="publisher" /></div>
		</div>
	</div>
</xsl:template>

</xsl:stylesheet>

